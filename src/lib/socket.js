import { Server } from "socket.io"
import http from 'http'
import express from 'express'

import { codesMap, createRoom, destroyRoom, joinRoom, roomsMap } from "../controllers/roomController.js"
import { generateBingoNumbers, generateInitialNumbers, pickRandomNumber } from "./bingoNumbers.js"

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://192.168.1.149:3000', 'http://192.168.68.113:3000']

    },
    connectionStateRecovery: {
        // maxDisconnectionDuration: 2 * 60 * 1000,
        // skipMiddlewares: true
    }
})

const sockets = new Set()

io.on('connection', (socket) => {
    console.log('user connected', socket.id)
    sockets.add(socket.id)
    console.log('connected sockets', sockets)
    socket.on('room:create', (user) => createRoom(user, socket))
    socket.on('room:join', (data) => joinRoom(data, socket))

    socket.on('click', (data) => {
        const { roomId } = data
        console.log('click', roomId)
        socket.in(roomId).emit('clicked', { status: 'ok', ...data })
        socket.emit('clicked', { status: 'ok', ...data })
    })
    socket.on('game:start', (data) => {
        const { roomId } = data
        const room = roomsMap.get(roomId)
        const { admin } = room
        const bingoNumbers = generateBingoNumbers();
        const roomPlayers = room.players
        const iterator = roomPlayers.entries()
        const newPlayersMap = new Map()
        for (let i = 0; i < roomPlayers.size; i++) {
            const [k, v] = iterator.next().value
            newPlayersMap.set(k, { ...v, numbers: bingoNumbers[i] })
            console.log(`bingo ${i}`, bingoNumbers[i])
        }
        console.log(newPlayersMap)

        const updatedRoom = {
            admin,
            numbers: [3, 4, 5, 6],
            players: Object.fromEntries(newPlayersMap.entries())
        }
        roomsMap.delete(roomId)
        roomsMap.set(roomId, updatedRoom)

        console.log('game start', roomsMap.get(roomId), updatedRoom)
        socket.in(roomId).emit('game:started', roomsMap.get(roomId))
        socket.emit('game:started', roomsMap.get(roomId))

        //generate numbers
    })
    socket.on('game:next-number', ({ markedNumbers, roomId }) => {
        const { initialNumbersSet } = generateInitialNumbers()
        const markedNumbersSet = new Set(markedNumbers)
        console.log('initial:', initialNumbersSet, 'marked:', markedNumbersSet)

        const availableNumbers = initialNumbersSet.difference(markedNumbersSet)
        const { randomNumber, updatedSet } = pickRandomNumber(availableNumbers)
        socket.to(roomId).emit('game:number-generated', { randomNumber, updatedSet: [...updatedSet] })
        socket.emit('game:number-generated', { randomNumber, updatedSet: [...updatedSet] })
    })


    socket.on('disconnect', async () => {
        console.log('user disconnected', socket.id)
        destroyRoom(socket)
        sockets.delete(socket.id)
        console.log('remaining sockets', sockets)

    })
})

export { io, app, server }

