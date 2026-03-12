Vue.component('column-component', {
    props: ['columnId', 'columnTitle', 'allCards'],
    template: `
        <div class="column" :data-column-id="columnId">
            <h2> {{ columnTitle }} </h2>
            
            <card-component
            v-for="card in columnCards"
            :key="card.id"
            :card-data="card"
            @move-card="forwardMoveCard"
            @return-to-second="forwardReturnToSecond"
            @edit-card="forwardEditCard"
            @delete-card="forwardDeleteCard">
            </card-component>
        </div>
    `,
    computed: {
        columnCards() {
            return this.allCards.filter(card => card.column === this.columnId)
        }
    },
    methods: {
        forwardMoveCard(event) {
            this.$emit('move-card', event)
        },
        forwardReturnToSecond(event) {
            this.$emit('return-to-second', event)
        },
        forwardEditCard(event) {
            this.$emit('edit-card', event)
        },
        forwardDeleteCard(event) {
            this.$emit('delete-card', event)
        }
    }
})

Vue.component('card-component', {
    props: ['cardData'],
    template: `
        <div :class="cardClasses" ref="cardElement">
            <div class="card-header">
                <h3 class="card-title"> 
                {{ cardData.title }}
                <span v-if="cardData.returnCount > 0" class="return-badge">
                    Возвратов: {{ cardData.returnCount }}
                </span>
                </h3>
                 <span v-if="cardData.isPriority" class="priority-badge">Приоритет</span>
            </div>
                
            <p class="card-description"> {{ cardData.description }} </p>
            <div class="card-meta">
                <p>Создано: {{ formatDate(cardData.createdAt) }} </p>
                <p>Дедлайн: {{ formatDate(cardData.deadline) }} </p>
                <p v-if="cardData.returnReason" class="return-reason">
                    Причина возврата: {{ cardData.returnReason }}
                </p>
                <p v-if="cardData.editedAt" class="edited">
                    Изменено: {{ formatDate(cardData.editedAt) }}
                </p>
                <p v-if="cardData.column === 4" :class="deadlineStatus">
                    Статус: {{ statusText }}
                </p>
            </div>
            
            <div class="card-actions" v-if="cardData.column !== 4">
                <button @click="deleteCard"
                v-if="cardData.column === 1" 
                class="action-button delete">Удалить</button>
                <button @click="editCard" class="action-button edit">Редактировать</button>
                
                <button
                v-if="cardData.column === 3"
                @click="moveBack"
                class="move-button back">Вернуть</button>
                
                <button
                v-if="cardData.column < 4"
                @click="moveForward"
                class="move-button">Переместить</button>
            </div>
        </div>
    `,
    computed: {
      isOverdue() {
          if (this.cardData.column !== 4)
              return false
          const deadline = new Date(this.cardData.deadline)
          const now = new Date()
          return deadline < now
      },
      deadlineStatus() {
          if (this.cardData.column !== 4)
              return ''
          return this.isOverdue ? 'overdue' : 'ontime'
      },
      statusText() {
          if (this.cardData.column !== 4)
              return ''
          return this.isOverdue ? 'Просрочено' : 'Выполнено в срок'
      },
        hoursUntilDeadline() {
            const now = new Date()
            const deadline = new Date(this.cardData.deadline)
            const diffMs = deadline - now
            return Math.floor(diffMs / (1000 * 60 * 60))
        },
        deadlineWarningClass() {
            if(this.cardData.column === 4) return ''

            const hours = this.hoursUntilDeadline

            if (hours < 24) {
                return 'deadline-critical'
            } else if (hours < 72) {
                return 'deadline-warning'
            }
            return ''
        },
        cardClasses() {
            return {
                'card': true,
                'priority-card': this.cardData.isPriority,
                'deadline-critical': this.deadlineWarningClass === 'deadline-critical',
                'deadline-warning': this.deadlineWarningClass === 'deadline-warning',
                'card-moving': this.$parent.movingCardId === this.cardData.id
            }
        }
    },
    methods: {
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        },
        moveForward() {
            let coordinates = null
            if (this.$refs.cardElement) {
                const rect = this.$refs.cardElement.getBoundingClientRect()
                coordinates = {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                }
            }

            this.$emit('move-card', {
                cardId: this.cardData.id,
                toColumn: this.cardData.column + 1,
                element: this.$refs.cardElement,
                coordinates:  coordinates,
            })
        },
        moveBack() {
            this.$emit('return-to-second', {
                cardId: this.cardData.id,
                element: this.$refs.cardElement,
                coordinates: this.$refs.cardElement ? this.$refs.cardElement.getBoundingClientRect() : null
            })
        },
        editCard() {
            this.$emit('edit-card', this.cardData)
        },
        deleteCard() {
            if(confirm('Удалить задачу навсегда?')) {
                this.$emit('delete-card', this.cardData.id)
            }
        }
    }
})

Vue.component('add-card-form', {
    props: ['allCards'],

    data() {
        return {
            title: '',
            description: '',
            deadline: '',
            error: ''
        }
    },
    methods: {
        addCard(){
            if(!this.title.trim()) {
                this.error = 'Введите заголовок'
                return
            }

            if (!this.description.trim()) {
                this.error = 'Введите описание'
                return
            }

            if (!this.deadline) {
                this.error = 'Выберите дедлайн'
                return
            }

            const deadlineDate = new Date(this.deadline)
            const now = new Date()

            if (deadlineDate < now) {
                this.error = 'Дедлайн должен быть в будущем времени'
                return
            }

            const newCard = {
                id: Date.now(),
                title: this.title.trim(),
                description: this.description.trim(),
                deadline: this.deadline,
                createdAt: new Date().toISOString(),
                editedAt: null,
                column: 1,
                returnReason: null,
                returnCount: 0
            }
            this.$emit('card-created', newCard)

            this.title = ''
            this.description = ''
            this.deadline = ''
            this.error = ''
        },

        getTodayString() {
            const today = new Date()
            const year = today.getFullYear()
            const month = String(today.getMonth() + 1).padStart(2, '0')
            const day = String(today.getDate()).padStart(2, '0')
            const hours = String(today.getHours()).padStart(2, '0')
            const minutes = String(today.getMinutes()).padStart(2, '0')
            return `${year}-${month}-${day}T${hours}:${minutes}`
        }
    },
    template: `
        <div class="add-form">
            <h3>Добавить новую задачу</h3>
            
            <div class="form-group">
                <label>Заголовок:</label>
                <input type="text" v-model="title" placeholder="Введите заголовок">
            </div>
            
            <div class="form-group">
                <label>Описание:</label>
                <textarea v-model="description" placeholder="Введите описание задачи"></textarea>
            </div>
            
            <div class="form-group">
                <label>Дедлайн:</label>
                <input type="datetime-local" v-model="deadline" :min="getTodayString()">
            </div>
            
             <div v-if="error" class="error">
                {{ error }}
            </div>
            
            <button @click="addCard">Создать задачу</button>
        </div>
    `
})

Vue.component('edit-modal', {
    props: {
        isVisible: {
            type: Boolean,
            default: false
        },
        card: {
            type: Object,
            default: null
        }
    },
    data(){
        return {
            editedTitle: '',
            editedDescription: '',
            editedDeadline: '',
        }
    },
    watch: {
        card: {
            handler(newCard) {
                if (newCard) {
                    this.editedTitle = newCard.title
                    this.editedDescription = newCard.description

                    const date = new Date(newCard.deadline)
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const day = String(date.getDate()).padStart(2, '0')
                    const hours = String(date.getHours()).padStart(2, '0')
                    const minutes = String(date.getMinutes()).padStart(2, '0')
                    this.editedDeadline = `${year}-${month}-${day}T${hours}:${minutes}`
                }
            }
        }
    },
    methods: {
        save() {
            if (!this.editedTitle.trim()) {
                alert('Заголовок не может быть пустым')
                return
            }

            if(!this.editedDescription.trim()) {
                alert('Описание не может быть пустым')
                return
            }

            const deadlineDate = new Date(this.editedDeadline)
            const now = new Date()

            if (deadlineDate < now) {
                alert('Дедлайн должен быть в будущем времени')
                return
            }

            this.$emit('save', {
                title: this.editedTitle.trim(),
                description: this.editedDescription.trim(),
                deadline: this.editedDeadline,
                editedAt: new Date().toISOString()
            })
        },
        close(){
            this.$emit('close')
        }
    },
    template: `
        <div v-if="isVisible" class="modal-window" @click.self="close">
            <div class="modal">
                <h3>Редактировать задачу</h3>
                
                <div class="form-group">
                    <label>Заголовок:</label>
                    <input type="text" v-model="editedTitle">
                </div>
                
                <div class="form-group">
                    <label>Описание:</label>
                    <textarea v-model="editedDescription"></textarea>
                </div>
                
                <div class="form-group">
                    <label>Дедлайн:</label>
                    <input type="datetime-local" v-model="editedDeadline":min="editedDeadline">
                </div>
                
                <div class="modal-actions">
                    <button @click="close">Отмена</button>
                    <button @click="save">Сохранить</button>
                </div>
            </div>
        </div>
    `
})

Vue.component('return-modal', {
    props: {
        isVisible: {
            type: Boolean,
            default: false
        },
        cardId: {
            type: [Number],
            default: null
        }
    },
    data() {
        return {
            reason: ''
        }
    },
    methods: {
        confirm() {
            if (!this.reason.trim()) {
                alert('Причина возврата')
                return
            }
            this.$emit('confirm', {
                cardId: this.cardId,
                reason: this.reason.trim()
            })
            this.reason = ''
        },
        close() {
            this.$emit('close')
            this.reason = ''
        }
    },
    template: `
        <div v-if="isVisible" class="modal-window" @click.self="close">
            <div class="modal">
                <h3>Причина возврата</h3>
                
                <div class="form-group">
                    <label>Укажите причину, почему вы возвращаете задачу на повторную работу</label>
                    <textarea v-model="reason" placeholder="Найден баг, задача не прошла тест, или другое"></textarea>
                </div>
                
                <div class="modal-actions">
                    <button @click="close">Отмена</button>
                    <button @click="confirm">Подтвердить</button>
                </div>
            </div>
        </div>
    `
})

Vue.component('app-component', {
    data() {
        return {
            columns: [
                {id: 1, title: 'Запланированные задачи'},
                {id: 2, title: 'Задачи в работе'},
                {id: 3, title: 'Тестирование'},
                {id: 4, title: 'Выполненные задачи'}
            ],
            allCards: [],
            showReturnModal: false,
            returningCardId: null,
            showEditModal: false,
            editingCard: null,
            animatingCardId: null,
            animationDirection: null,
            movingCardId: null,
            flyingCard: null,
            flyingStyle: {
                top: '0px',
                left: '0px',
                width: '0px',
                height: '0px',
                display: 'none'
            }
        }
    },
    methods: {
        addCard(cardData){
            this.allCards.push(cardData)
            this.saveToLocalStorage()
        },
        moveCard(moveInfo) {
            this.animateCardMovement(moveInfo, moveInfo.toColumn)
        },
        returnToSecond(moveInfo) {
            this.animateCardMovement(moveInfo, 2)
        },
        confirmReturn(data) {
            const card = this.allCards.find(card => card.id === data.cardId)
            if (card) {
                card.column = 2
                card.returnReason = data.reason
                card.returnCount = (card.returnCount || 0) + 1

                if (card.returnCount > 1) {
                    const newDeadline = prompt('This is not the first time the task has been returned. Set a new deadline', card.deadline)
                    if (newDeadline) {
                        card.deadline = newDeadline
                    }
                }

                this.saveToLocalStorage()
            }
            this.showReturnModal = false
            this.returningCardId = null
        },
        closeModal() {
            this.showReturnModal = false
            this.returningCardId = null
        },
        editCard(card) {
            this.editingCard = card
            this.showEditModal = true
        },
        saveCardEdit(updates) {
            const card = this.allCards.find(card => card.id === this.editingCard.id)
            if (card) {
                card.title = updates.title
                card.description = updates.description
                card.deadline = updates.deadline
                card.editedAt = updates.editedAt
                this.saveToLocalStorage()
            }
            this.showEditModal = false
            this.editingCard = null
        },
        closeEditModal() {
            this.showEditModal = false
            this.editingCard = null
        },
        deleteCard(cardId) {
            this.allCards = this.allCards.filter(card => card.id !== cardId)
            this.saveToLocalStorage()
        },
        saveToLocalStorage() {
            localStorage.setItem('kanban-app', JSON.stringify(this.allCards))
        },
        loadFromLocalStorage() {
            const saved = localStorage.getItem('kanban-app')
            if (saved) {
                this.allCards = JSON.parse(saved)
            }
        },
        moveCardWithAnimation(moveInfo) {
            const card = this.allCards.find(c => c.id === moveInfo.cardId)
            if (!card) return

            this.movingCardId = moveInfo.cardId

            setTimeout(() => {
                this.moveCard(moveInfo)

                setTimeout(() => {
                    this.movingCardId = null
                }, 50)
            }, 1800)
        },
        animateCardMovement(moveInfo, targetColumnId) {
            const sourceCardData = this.allCards.find(c => c.id === moveInfo.cardId)
            if (!sourceCardData) return

            const sourceElement = moveInfo.element
            if (!sourceElement) return

            const sourceRect = sourceElement.getBoundingClientRect()
            const targetColumn = document.querySelector(`[data-column-id="${targetColumnId}"]`)
            if (!targetColumn) return
            const targetRect = targetColumn.getBoundingClientRect()

            this.flyingCard = { ...sourceCardData }
            this.flyingStyle = {
                display: 'block',
                position: 'fixed',
                top: sourceRect.top + 'px',
                left: sourceRect.left + 'px',
                width: sourceRect.width + 'px',
                zIndex: 9999,
                opacity: 1,
                transition: 'all 0.5s ease-in-out',
                transform: 'scale(1)',
                boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
            }

            this.$nextTick(() => {
                setTimeout(() => {
                    const targetLeft = targetRect.left + (targetRect.width / 2) - (sourceRect.width / 2)
                    const targetTop = targetRect.top + (targetRect.height / 2) - (sourceRect.height / 2)

                    this.flyingStyle = {
                        ...this.flyingStyle,
                        top: targetTop + 'px',
                        left: targetLeft + 'px',
                        opacity: 0,
                        transform: 'scale(0.8)',
                    }
                }, 50)
            })

            setTimeout(() => {
                const cardToMove = this.allCards.find(c => c.id === moveInfo.cardId)
                if (cardToMove) {
                    cardToMove.column = targetColumnId
                    this.saveToLocalStorage()
                }

                this.flyingCard = null
                this.flyingStyle.display = 'none'
            }, 600)
        }
    },
    mounted() {
        this.loadFromLocalStorage()
    },
    template: `
        <div class="app">
            <h1>Kanban</h1>

            <add-card-form :all-cards="allCards" @card-created="addCard"></add-card-form>

            <div class="columns-container">
                <column-component
                v-for="col in columns"
                :key="col.id"
                :column-id="col.id"
                :column-title="col.title"
                :all-cards="allCards"
                @move-card="moveCard"
                @return-to-second="returnToSecond"
                @edit-card="editCard"
                @delete-card="deleteCard">
                </column-component>
            </div>
            
            <return-modal
            :is-visible="showReturnModal"
            :card-id="returningCardId"
            @confirm="confirmReturn"
            @close="closeModal">
            </return-modal>

            <edit-modal
            :is-visible="showEditModal"
            :card="editingCard"
            @save="saveCardEdit"
            @close="closeEditModal">
            </edit-modal>
            
            <div v-if="flyingCard" class="card flying-card" :style="flyingStyle">
                <div class="card-header">
                    <h3 class="card-title">{{ flyingCard.title }}</h3>
                </div>
                <p class="card-description">{{ flyingCard.description }}</p>
            </div>
        </div>
    `
})

let app = new Vue ({
    el: '#app',
    template: '<app-component></app-component>'
})