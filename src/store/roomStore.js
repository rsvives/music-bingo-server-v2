/* abstract */class RoomStore {
    findRoom(id) { }
    saveRoom(id, { roomId, code, players = new Map() }) { }
    addPlayer(id, { playerID, sessionID }) { }
    // updatePlayerSession(id, { playerID, sessionID }) { }
    removePlayer(id, { playerID }) { }
    roomAdmin(roomId) { }
    // findAllRooms() { }
    removeRoom(id) { }
}

class InMemoryRoomStore extends RoomStore {
    constructor() {
        super();
        this.rooms = new Map();
    }
    findRoom(id) {
        // TODO: add redis layer
        return this.rooms.get(id)
    }
    saveRoom(id, { roomId, code, admin, players = new Map(), calledNumbers = new Set() }) {
        // TODO: add redis layer
        //redis
        // const savedRedisData = await JSON.parse(await redisClient.get('roomCodes'))
        // const newValue = {}
        // newValue[roomId] = code
        // const newRedisData = { ...savedRedisData, ...newValue }
        // const updatedRedisData = await redisClient.set('roomCodes', JSON.stringify(newRedisData))
        // console.log('saved redis data', updatedRedisData, roomId)

        this.rooms.set(id, { roomId, code, admin, players, calledNumbers })
    }
    checkCode(roomId, code) {

        // TODO: add redis layer
        // const redisRoomCodes = await JSON.parse(await redisClient.get('roomCodes'))
        // const realCode = redisRoomCodes[roomId]
        // const room = roomStore.findRoom(roomId)

        return code === this.findRoom(roomId)?.code
    }
    addPlayer(id, { playerID, player }) {
        const room = this.findRoom(id)
        if (!room.players.get(playerID)) {
            const updatedPlayers = room.players.set(playerID, player)
            this.saveRoom(id, { ...room, players: updatedPlayers })
        }
    }
    findMarkedNumbers(roomId, playerId) {
        console.log('find marked', roomId)
        const room = this.findRoom(roomId)
        const player = room?.players.get(playerId)

        if (!player) {
            return null
        }
        if (player.markedNumbers === null || player.markedNumbers === undefined) {
            player.markedNumbers = new Set()
            room.players.set(playerId, { ...player })
            this.saveRoom(roomId, { ...room })
        }
        return player.markedNumbers

    }
    addMarkedNumber(roomId, playerId, number) {
        console.log('add marked', roomId, playerId, number)
        const markedNumbers = this.findMarkedNumbers(roomId, playerId)
        markedNumbers.add(number)

    }
    removePlayer(id, { playerID }) {
        const room = this.findRoom(id)
        if (room) {
            const updatedPlayers = room.players
            updatedPlayers.delete(playerID)
            this.saveRoom(id, { ...room, players: updatedPlayers })
        }
    }
    addCalledNumber(roomId, number) {
        const calledNumbers = this.findCalledNumbers(roomId)
        console.log('before adding', calledNumbers, number)
        calledNumbers.add(number)
        console.log('added', calledNumbers)
        return calledNumbers
    }
    findCalledNumbers(roomId) {
        const room = this.findRoom(roomId)
        // console.log('foundcalled numbers', room?.calledNumbers)

        return room?.calledNumbers ?? new Set()
    }

    roomAdmin(roomId) {
        const room = this.rooms.get(roomId)

        return room ? room.admin : null
    }
    removeRoom(id) {
        this.rooms.delete(id)
    }
}


export const roomStore = new InMemoryRoomStore()