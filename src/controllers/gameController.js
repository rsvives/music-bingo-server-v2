import superjson from 'superjson'
import { generateBingoNumbers } from "../lib/bingoNumbers.js";
import { roomStore } from "../store/roomStore.js";
import { sessionStore } from '../store/sessionStore.js';

export const startGame = (socket, data) => {
    // const roomId = socket.roomId
    const { roomId } = data
    const room = roomStore.findRoom(roomId)
    // const { admin } = room
    const roomPlayers = room.players
    const bingoNumbers = generateBingoNumbers({ jugadores: roomPlayers.size });
    //console.log('game:start', socket.roomId, roomPlayers)
    const iterator = roomPlayers.entries()

    for (let i = 0; i < roomPlayers.size; i++) {
        const [k, v] = iterator.next().value
        roomPlayers.set(k, { ...v, marked: 0, numbers: bingoNumbers[i] })
        //console.log(`bingo ${i}`, bingoNumbers[i])
    }

    socket.roomId = roomId

    roomStore.saveRoom(roomId, { ...room, players: roomPlayers, gameStatus: 'started' })
    const storedRoom = roomStore.findRoom(roomId)
    // //console.log(storedRoom)
    const { json, meta } = superjson.serialize({ ...storedRoom })
    socket.to(roomId).emit('game:started', { json, meta })
    socket.emit('game:started', { json, meta })
}

export const restartGame = (socket) => {
    socket.to(socket.roomId).emit('game:restarted')
    const room = roomStore.findRoom(socket.roomId)
    roomStore.saveRoom(socket.roomId, { ...room, calledNumbers: new Set(), gameStatus: 'started' })
    //TODO: restart bingo numbers and markednumbers too
    socket.emit('game:restarted')
}

export const pauseGame = (socket) => {
    roomStore.changeGameStatus(socket.roomId, 'paused')
    socket.to(socket.roomId).emit('game:paused')
    socket.emit('game:paused')
}

export const resumeGame = (socket) => {
    roomStore.changeGameStatus(socket.roomId, 'started')
    socket.to(socket.roomId).emit('game:resumed')
    socket.emit('game:resumed')
}

export const endGame = async (socket) => {
    //console.log('game ended')
    roomStore.changeGameStatus(socket.roomId, 'ended')
    // const savedRooms = await redisClient.get('roomCodes')


    sessionStore.deleteSession(socket.sessionID)
    //console.log('isAdmin', socket.user)
    if (socket.user?.isAdmin) {
        roomStore.removeRoom(socket.roomId)
    }
    //console.log('leaving', socket.user.id)
    socket.emit('game:ended')
    socket.to(socket.roomId).emit('game:ended')
    socket.leave(socket.roomId)
    socket.sessionID = null
    socket.roomId = null
    socket.code = null
    socket.bingoNumbers = null
    socket.markedNumbers = null
    socket.calledNumbers = null

}

export const terminateGame = async (socket) => {
    //console.log('terminating game')

    sessionStore.deleteSession(socket.sessionID)
    socket.leave(socket.roomId)
    socket.sessionID = null
    socket.roomId = null
    socket.code = null
    socket.bingoNumbers = null
    socket.markedNumbers = null
    socket.calledNumbers = null
}