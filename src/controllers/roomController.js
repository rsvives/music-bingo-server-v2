import { redisClient } from "../lib/cache.js"
import superjson from 'superjson'
import { addPlayer, newPlayersMap } from "./playerController.js"

import { findRoomByAdminId, findRoomsByAdminSocket, generate6DigitCode, generateRoomId } from "../lib/utils.js"
import { roomStore } from "../store/roomStore.js"
import { sessionStore } from "../store/sessionStore.js"

export const createRoom = async (socket) => {

    const { user } = socket
    const storedSession = sessionStore.findSession(socket.sessionID)

    if (!storedSession || !storedSession?.roomId || !socket?.roomId) { // !socket.room
        console.log('creating room', user)

        const roomId = generateRoomId()
        const code = generate6DigitCode()
        const currentSessionData = sessionStore.findSession(socket.sessionID)

        sessionStore.saveSession(socket.sessionID, {
            ...currentSessionData,
            roomId,
            code
        })

        socket.roomId = roomId
        socket.code = code


        console.log('saved sessions', sessionStore.findSession(socket.sessionID))

        roomStore.saveRoom(roomId, { roomId, code, admin: user })
        console.log('saved room', roomStore.findRoom(roomId))
        const lastPlayerJoined = { ...user, sessionID: socket.sessionID, score: 0, markedNumbers: new Set(), isAdmin: true, connected: true }
        roomStore.addPlayer(roomId, { playerID: user.id, player: lastPlayerJoined })



        socket.join(roomId)

        socket
            .emit('room:ready', { roomId: roomId, code, lastPlayerJoined })
        console.log('room ready')
    } else {
        const storedRoom = roomStore.findRoom(socket.roomId)
        console.error('user already created a room, reconnecting', storedRoom)
        const { json, meta } = superjson.serialize({ ...storedRoom })
        socket.emit('room:reconnect', { json, meta })

    }
}

export const joinRoom = async (data, socket) => {

    console.log('joining room')

    const { room, code } = data


    if (roomStore.checkCode(room, code)) {
        console.log('code matched, all good')

        socket.roomId = room
        socket.code = code

        const savedStore = sessionStore.findSession(socket.sessionID)
        sessionStore.saveSession(socket.sessionID, { ...savedStore, roomId: room, code })

        const roomData = roomStore.findRoom(room)
        console.log('roomData', roomData)

        if (!roomData.players?.get(socket.userID)) {
            roomStore.addPlayer(room, { playerID: socket.userID, player: { ...socket.user, score: 0, markedNumbers: new Set(), connected: true } })
            console.log(roomData.players)
        } else {
            console.log('rejoined')
            console.log(roomStore.findRoom(socket.roomId))
        }
        socket.join(room)
        console.log('join', roomData)
        const { json, meta } = superjson.serialize({ ...roomData, lastPlayerJoined: { ...socket.user, score: 0 } })

        socket
            .to(room)
            .emit('room:joined', { json, meta })
        socket.emit('room:joined', { json, meta })
    } else {
        console.error('wrong code')
    }
}

export const leaveRoom = async (data, socket) => {
    console.log('leaving room', data, socket.roomId, socket.userID)


    if (roomStore.roomAdmin(socket.roomId) === socket.userID) {

    } else {
        roomStore.removePlayer(socket.roomId, { playerID: socket.userID })
        socket.leave(socket.roomId)
        socket.to(socket.roomId).emit('room:leaved', socket.userID)
        socket.emit('room:leaved', socket.userID)

        socket.roomId = null
        socket.code = null
    }

}

export const destroyRoom = async (socket) => {
    // console.log('removing rooms')
    // const adminId = usersMap.get(socket.id)

    // const roomIds = adminId ? findRoomByAdminId({ roomsMap, userId: adminId }) : null
    // if (roomIds) {

    //     const redisData = await JSON.parse(await redisClient.get('roomCodes'))
    //     console.log('delete redis', redisData)
    //     for (let key of roomIds) {
    //         roomsMap.delete(key)
    //         codesMap.delete(key)
    //         if (redisData && redisData[key]) delete redisData[key]
    //     }

    //     usersMap.delete(socket.id)
    //     const updatedRedisData = await redisClient.set('roomCodes', JSON.stringify(redisData))
    //     console.log(roomsMap, codesMap)
    //     console.log('redis', updatedRedisData)
    // } else {
    //     console.log('no rooms for user')
    // }
}


export const roomCheck = async (req, res) => {
    const { roomId, code } = req.body

    const room = roomStore.findRoom(roomId)



    if (!room) return res.status(404).send({ message: 'room not found' })
    if (roomStore.checkCode(roomId, code)) return res.status(301).send({ message: 'wrong code' })


    const { json, meta } = superjson.serialize(room)
    res.status(200).send({ json, meta })
}