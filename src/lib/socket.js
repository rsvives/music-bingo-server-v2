import { Server } from "socket.io"
import { instrument } from "@socket.io/admin-ui"
import http from 'http'
import express from 'express'
import superjson from 'superjson'
import { createRoom, destroyRoom, joinRoom, leaveRoom } from "../controllers/roomController.js"
// import { generateBingoNumbers, generateInitialNumbers, pickRandomNumber } from "./bingoNumbers.js"
import { randomId } from "./utils.js"
import { sessionStore } from "../store/sessionStore.js"
// import { roomStore } from "../store/roomStore.js"
// import { redisClient } from "./cache.js"
import { endGame, pauseGame, restartGame, resumeGame, startGame } from "../controllers/gameController.js"
import { bingoMarked, lineMarked, markNumber, nextNumber } from "../controllers/numberController.js"
import { roomStore } from "../store/roomStore.js"

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:3000',
            'http://192.168.1.149:3000',
            'http://192.168.68.113:3000',
            'http://192.168.0.75:3000'
        ]

    },
    connectionStateRecovery: {
        // maxDisconnectionDuration: 2 * 60 * 1000,
        // skipMiddlewares: true
    }
})
instrument(io, { auth: false, mode: "development", })

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
        // console.log(session)
        if (session) {
            socket.userID = session.userID
            socket.user = session.user
            socket.sessionID = sessionID;
            socket.roomId = session?.roomId
            socket.code = session?.code

            if (roomStore.checkCode(session.roomId, session.code)) {
                socket.join(session.roomId)
                socket.to(socket.roomId).emit('player:rejoined', socket.user)
            }
            console.log('middleware:recovered session', session, roomStore.findRoom(socket.roomId))
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

    const { meta, json } = superjson.serialize({
        sessionID: socket.sessionID,
        user: socket.user,
        bingoNumbers: roomStore.findRoom(socket.roomId)?.players.get(socket.userID)?.numbers ?? null,
        markedNumbers: roomStore.findMarkedNumbers(socket.roomId, socket.userID) ?? new Set(),
        calledNumbers: roomStore.findCalledNumbers(socket.roomId)
    })

    socket.emit("session", { meta, json });

    //ROOM
    socket.on('room:create', () => createRoom(socket))
    socket.on('room:join', (data) => joinRoom(data, socket))
    socket.on('room:leave', (data) => leaveRoom(data, socket))

    //GAME
    socket.on('game:start', (data) => startGame(socket, data))
    socket.on('game:restart', () => restartGame(socket))
    socket.on('game:pause', () => pauseGame(socket))
    socket.on('game:resume', () => resumeGame(socket))
    socket.on('game:end', () => endGame(socket))

    //NUMBERS
    socket.on('number:next', () => nextNumber(socket))
    socket.on('number:mark', (score, number) => markNumber(score, socket, number))
    socket.on('number:line', () => lineMarked(socket))
    socket.on('number:bingo', () => bingoMarked(socket))


    // socket.on('player:disconnected')

    socket.on('disconnect', async () => {
        socket.to(socket.roomId).emit('player:disconnected', socket.user)
        console.log('user disconnected', socket.user)
        destroyRoom(socket)
        sockets.delete(socket.id)
        console.log('remaining sockets', sockets)

    })
})

export { io, app, server }

