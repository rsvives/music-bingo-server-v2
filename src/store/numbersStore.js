class NumbersStore {
    findNumbers(playerId) { }
    saveNumbers(playerId, numbers) { }
    removeNumbers(playerId) { }
}

class InMemoryNumbersStore extends NumbersStore {
    constructor() {
        super()
        this.numbers = new Map()
    }

    findNumbers(playerId) {
        return this.numbers.get(playerId)
    }
    saveNumbers(playerId, numbers) {
        this.numbers.set(playerId, numbers)
    }
    removeNumbers(playerId) {
        this.numbers.delete(playerId)
    }
}

export const playerStore = new InMemoryNumbersStore()