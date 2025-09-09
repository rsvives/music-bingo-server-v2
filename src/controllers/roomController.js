import { redisClient } from "../lib/cache.js"
import { findRoomByAdminId, findRoomsByAdminSocket, generate6DigitCode, generateRoomId } from "../lib/utils.js"
import { addPlayer, newPlayersMap } from "./playerController.js"


export const codesMap = new Map()
export const roomsMap = new Map()
export const usersMap = new Map()

console.log('size', codesMap.size)

export const createRoom = async (user, socket) => {
    if (findRoomByAdminId({ roomsMap, userId: user.id }).length === 0) {
        console.log('creating room', user)

        const roomId = generateRoomId()
        const code = generate6DigitCode()

        const playersMap = newPlayersMap()
        const { playersMap: updatedPlayersMap, player: admin } = addPlayer({ isAdmin: true, playersMap, socket, user })

        codesMap.set(roomId, code)
        usersMap.set(socket.id, user.id)
        //redis
        const savedRedisData = await JSON.parse(await redisClient.get('roomCodes'))
        const newValue = {}
        newValue[roomId] = code
        const newRedisData = { ...savedRedisData, ...newValue }
        const updatedRedisData = await redisClient.set('roomCodes', JSON.stringify(newRedisData))
        console.log('saved redis data', updatedRedisData, roomId)


        roomsMap.set(roomId, { admin, players: updatedPlayersMap, numbers: [] })
        console.log(roomsMap, codesMap)

        socket.join(roomId)
        socket
            .emit('room:ready', { room: roomId, code, lastPlayerJoined: admin, })
        console.log('room ready')
    } else {
        console.error('user already created a room')
    }
}

export const joinRoom = async (data, socket) => {

    console.log('joining room')

    const { room, code, user } = data

    const savedRedisData = await JSON.parse(await redisClient.get('roomCodes'))
    const realCode = savedRedisData[room]


    if (code == realCode) {
        socket.join(room)
        console.log('code matched, all good')

        let roomData = roomsMap.get(room)
        // roomData.players.(socket.id, user)
        const { playersMap, player } = addPlayer({ playersMap: roomData.players, socket, user })
        roomData.players = playersMap
        roomData.numbers = [1, 2, 3]
        roomsMap.set(room, roomData)

        console.log(roomData.players)
        const dataToSend = {
            admin: roomData.admin,
            roomId: room,
            players: Object.fromEntries(roomData.players.entries()),
            numbers: roomData.numbers,
            lastPlayerJoined: {
                [player.id]: { ...player }
            }
        }

        socket
            .to(room)
            .emit('room:joined', dataToSend)
        socket.emit('room:joined', dataToSend)
    } else {
        console.error('wrong code')
    }
}


export const destroyRoom = async (socket) => {
    console.log('removing rooms')
    const adminId = usersMap.get(socket.id)

    const roomIds = adminId ? findRoomByAdminId({ roomsMap, userId: adminId }) : null
    if (roomIds) {

        const redisData = await JSON.parse(await redisClient.get('roomCodes'))
        console.log('delete redis', redisData)
        for (let key of roomIds) {
            roomsMap.delete(key)
            codesMap.delete(key)
            if (redisData && redisData[key]) delete redisData[key]
        }

        usersMap.delete(socket.id)
        const updatedRedisData = await redisClient.set('roomCodes', JSON.stringify(redisData))
        console.log(roomsMap, codesMap)
        console.log('redis', updatedRedisData)
    } else {
        console.log('no rooms for user')
    }
}


export const roomCheck = async (req, res) => {
    const { roomId, code } = req.body
    const redisRoomCodes = await JSON.parse(await redisClient.get('roomCodes'))

    const realCode = redisRoomCodes[roomId]
    console.log('checking', roomId, code, realCode)


    if (realCode == code && roomsMap.has(roomId)) {
        console.log(roomsMap.get(roomId))
        const roomData = roomsMap.get(roomId)
        console.log('players', roomData.players, Object.fromEntries(roomData.players.entries()))
        const data = {
            ...roomData,
            roomId,
            code,
            players: Object.fromEntries(roomData.players.entries()),
        }

        res.status(200).send(data)
    } else {
        res.status(404).send({ message: 'room not found' })
    }

}