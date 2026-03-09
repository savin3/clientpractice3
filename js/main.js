Vue.component('column-component', {
    props: ['columnId', 'columnTitle', 'allCards'],
    template: `
        <div class="column">
            <h2> {{ columnTitle }} </h2>
            
            <card-component
            v-for="card in columnCards"
            :key="card.id"
            :card-data="card">
            </card-component>
        </div>
    `,
    computed: {
        columnCards() {
            return this.allCards.filter(card => card.column === this.columnId)
        }
    }
})

Vue.component('card-component', {
    props: ['cardData'],
    template: `
        <div class="card">
            <h3> {{ cardData.title }} </h3>
            <p class="card-description"> {{ cardData.description }} </p>
            <div class="card-meta">
                <p>Создано: {{ formatDate(cardData.createdAt) }} </p>
                <p>Дедлайн: {{ formatDate(cardData.deadline) }} </p>
            </div>
            
            <div class="card-actions">
                <button
                v-if="cardData.column < 4"
                @click="moveForward"
                class="move-button">Переместить</button>
                
                <button
                v-if="cardData.column === 3"
                @click="moveBack"
                class="move-button back">Вернуть</button>
            </div>
        </div>
    `,
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
            this.$emit('move-card', {
                cardId: this.cardData.id,
                toColumn: this.cardData.column + 1
            })
        },
        moveBack() {
            this.$emit('return-to-second', this.cardData.id)
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
                returnReason: null
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
                <textarea v-model="description" placeholder="Введите описание задачи" rows="3"></textarea>
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

let app = new Vue ({
    el: '#app',
    data: {
        columns: [
            {id: 1, title: 'Запланированные задачи'},
            {id: 2, title: 'Задачи в работе'},
            {id: 3, title: 'Тестирование'},
            {id: 4, title: 'Выполненные задачи'}
        ],
        allCards: []
    },
    methods: {
        addCard(cardData){
            this.allCards.push(cardData)
        },
        moveCard(moveInfo) {
            const card = this.allCards.find(card => card.id === moveInfo.cardId)
            if (card) {
                card.column = moveInfo.toColumn
            }
        },
        returnToSecond(cardId) {
            const card = this.allCards.find(card => card.id === cardId)
            if(card) {
                card.column = 2
            }
        }
    }
})