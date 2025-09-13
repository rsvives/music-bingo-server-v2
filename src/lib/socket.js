import { Server } from "socket.io"
import http from 'http'
import superjson from 'superjson'
import express from 'express'

import { codesMap, createRoom, destroyRoom, joinRoom, leaveRoom, roomsMap } from "../controllers/roomController.js"
import { generateBingoNumbers, generateInitialNumbers, pickRandomNumber } from "./bingoNumbers.js"
import { randomId } from "./utils.js"
import { sessionStore } from "../store/sessionStore.js"
import { roomStore } from "../store/roomStore.js"

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

io.use((socket, next) => {
    console.log('middle')
    const user = socket.handshake.auth.user;
    if (!user) {
        return next(new Error("invalid user"));
    }
    const sessionID = socket.handshake.auth.sessionID;
    if (sessionID) {
        const session = sessionStore.findSession(sessionID);
        console.log(session)
        if (session) {
            socket.userID = session.userID
            socket.user = session.user
            socket.sessionID = sessionID;
            socket.roomId = session?.roomId
            socket.code = session?.code

            console.log('middleware:recovered session', session)
            return next();
        }
    }

    socket.sessionID = randomId();
    socket.userID = user.id;
    socket.user = user;
    console.log('middleware:new session', socket.sessionID, socket.userID)
    next();
});

io.on('connection', (socket) => {
    console.log('user connected', socket.id, socket.sessionID)

    sessionStore.saveSession(socket.sessionID, {
        sessionID: socket.sessionID,
        userID: socket.userID,
        user: socket.user,
        roomId: socket?.roomId,
        code: socket?.code,
        connected: true,
    });

    socket.emit("session", {
        sessionID: socket.sessionID,
        user: socket.user,
    });

    //ROOM
    socket.on('room:create', () => createRoom(socket))
    socket.on('room:join', (data) => joinRoom(data, socket))
    socket.on('room:leave', (data) => leaveRoom(data, socket))


    //GAME
    socket.on('game:start', (data) => {
        // const roomId = socket.roomId
        const { roomId } = data
        const room = roomStore.findRoom(roomId)
        const { admin } = room
        const bingoNumbers = generateBingoNumbers();
        const roomPlayers = room.players
        console.log('game:start', socket.roomId, roomPlayers)
        const iterator = roomPlayers.entries()
        const newPlayersMap = new Map()

        for (let i = 0; i < roomPlayers.size; i++) {
            const [k, v] = iterator.next().value
            roomPlayers.set(k, { ...v, marked: 0, numbers: bingoNumbers[i] })
            console.log(`bingo ${i}`, bingoNumbers[i])
        }

        roomStore.saveRoom(roomId, { ...room, players: roomPlayers })
        const storedRoom = roomStore.findRoom(roomId)

        const { json, meta } = superjson.serialize({ ...storedRoom })
        socket.to(roomId).emit('game:started', { json, meta })
        socket.emit('game:started', { json, meta })
    })
    socket.on('game:pause', () => {
        socket.to(socket.roomId).emit('game:paused')
        socket.emit('game:paused')
    })
    socket.on('game:next-number', ({ calledNumbers }) => {
        const { initialNumbersSet } = generateInitialNumbers()
        const calledNumbersSet = new Set(calledNumbers)

        const availableNumbers = initialNumbersSet.difference(calledNumbersSet)
        const { randomNumber, updatedSet } = pickRandomNumber(availableNumbers)
        if (updatedSet.size > 0) {
            socket.to(socket.roomId).emit('game:number-generated', { randomNumber, updatedSet: [...updatedSet] })
            socket.emit('game:number-generated', { randomNumber, updatedSet: [...updatedSet] })
        } else {
            socket.to(socket.roomId).emit('game:ended')
            socket.emit('game:ended')

        }
    })
    socket.on('game:mark-number', (score) => {
        //should check if its true
        socket.emit('player:marked', socket.userID, score)
        socket.to(socket.roomId).emit('player:marked', socket.userID, score)
    })
    socket.on('game:line', () => {
        //should check if its true
        socket.emit('player:line', socket.userID)
        socket.to(socket.roomId).emit('player:line', socket.userID)
    })
    socket.on('game:bingo', () => {
        //should check if its true
        socket.emit('player:bingo', socket.userID)
        socket.to(socket.roomId).emit('player:bingo', socket.userID)
    })
    socket.on('game:end', (data) => {
        console.log('game ended')
        socket.to(socket.roomId).emit('game:ended')
        socket.emit('game:ended')
    })


    socket.on('disconnect', async () => {
        console.log('user disconnected', socket.id)
        destroyRoom(socket)
        sockets.delete(socket.id)
        console.log('remaining sockets', sockets)

    })
})

export { io, app, server }

