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
        }
    }
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
    }
})