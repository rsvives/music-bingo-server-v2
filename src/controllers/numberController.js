import { generateInitialNumbers, pickRandomNumber } from "../lib/bingoNumbers.js"
import superjson from 'superjson'
import { roomStore } from "../store/roomStore.js"

export const nextNumber = (socket) => {
    const { initialNumbersSet } = generateInitialNumbers()
    console.log('next number', socket?.roomId)
    const calledNumbersSet = roomStore.findCalledNumbers(socket.roomId)

    const availableNumbers = initialNumbersSet.difference(calledNumbersSet)
    const { randomNumber, updatedSet } = pickRandomNumber(availableNumbers)
    const updatedCalledNumbers = roomStore.addCalledNumber(socket.roomId, randomNumber)

    console.log('calledNumbers', calledNumbersSet, randomNumber)
    if (updatedSet.size > 0) {
        socket.to(socket.roomId).emit('game:number-generated', { randomNumber, calledNumbers: [...updatedCalledNumbers] })
        socket.emit('game:number-generated', { randomNumber, calledNumbers: [...updatedCalledNumbers] })
    } else {
        socket.to(socket.roomId).emit('game:ended')
        socket.emit('game:ended')

    }
}

export const markNumber = (score, socket, number) => {
    //should check if its true

    roomStore.addMarkedNumber(socket.roomId, socket.userID, number)
    socket.emit('player:marked', socket.userID, score)
    socket.to(socket.roomId).emit('player:marked', socket.userID, score, roomStore.findMarkedNumbers(socket.roomId, socket.userID))
}

export const lineMarked = (socket) => {
    //should check if its true
    socket.emit('player:line', socket.userID)
    socket.to(socket.roomId).emit('player:line', socket.userID)
}

export const bingoMarked = (socket) => {
    //should check if its true
    socket.emit('player:bingo', socket.userID)
    socket.to(socket.roomId).emit('player:bingo', socket.userID)
}