Vue.component('column-component', {
    props: ['columnId', 'columnTitle', 'allCards'],
    template: `
        <div class="column">
            <h2> {{ columnTitle }} </h2>
            
        </div>
    `,
    computed: {
        columnCards() {
            return this.allCards.filter(card => card.column === this.columnId)
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