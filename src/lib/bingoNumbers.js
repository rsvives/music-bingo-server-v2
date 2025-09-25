export const generateInitialNumbers = (maxNumero = 90) => {
    const initialNumbers = Array.from({ length: maxNumero }, (v, k) => k + 1)
    const initialNumbersSet = new Set(initialNumbers)

    return { initialNumbers, initialNumbersSet }
}


export const generateBingoNumbers = ({ cantidadCartones = 6, numerosPorCarton = 15, maxNumero = 90, jugadores = 1 }) => {
    const cards = []
    console.log(jugadores)

    for (let v = 1; v <= Math.ceil(jugadores / cantidadCartones); v++) {
        const { initialNumbersSet } = generateInitialNumbers()

        for (let i = 1; i <= cantidadCartones; i++) {
            const [cardboard] = Array.from({ length: 1 }, (v, k) => {
                const set = new Set()
                while (set.size < 15) {
                    const randomNumberIndex = Math.floor(Math.random() * initialNumbersSet.size)
                    // console.log(randomNumberIndex)
                    const numbersArray = Array.from(initialNumbersSet)
                    const chosenValue = numbersArray[randomNumberIndex]
                    set.add(chosenValue)
                    initialNumbersSet.delete(chosenValue)
                }
                return Array.from(set)
            })
            //console.log(cardboard)
            const orderedCardboard = cardboard.sort((a, b) => a - b)
            //console.log(i,orderedCardboard)
            const columnsArray = [
                orderedCardboard.slice(0, 3),
                orderedCardboard.slice(3, 6),
                orderedCardboard.slice(6, 9),
                orderedCardboard.slice(9, 12),
                orderedCardboard.slice(12, 15),
            ]

            // Transpose columns to rows
            const transposedCard = columnsArray[0].map((_, colIndex) =>
                columnsArray.map(row => row[colIndex])
            )

            console.log('transposed', transposedCard)
            cards.push(transposedCard)
        }
    }

    console.log('generating bingo', cards)
    return cards
}

export const pickRandomNumber = (numbersSet) => {
    const randomNumberIndex = Math.floor(Math.random() * numbersSet.size)
    const randomNumber = [...numbersSet][randomNumberIndex]
    numbersSet.delete(randomNumber)

    return { randomNumber, updatedSet: numbersSet }
}
