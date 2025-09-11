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
        return this.rooms.get(id)
    }
    saveRoom(id, { roomId, code, admin, players = new Map() }) {
        this.rooms.set(id, { roomId, code, admin, players })
    }
    addPlayer(id, { playerID, player }) {
        const room = this.findRoom(id)
        if (!room.players.get(playerID)) {
            const updatedPlayers = room.players.set(playerID, player)
            this.saveRoom(id, { ...room, players: updatedPlayers })
        }
    }
    removePlayer(id, { playerID }) {
        const room = this.findRoom(id)
        if (room) {
            const updatedPlayers = room.players
            updatedPlayers.delete(playerID)
            this.saveRoom(id, { ...room, players: updatedPlayers })
        }
    }
    roomAdmin(roomId) {
        const room = this.rooms.get(roomId)
        return room.admin
    }
    removeRoom(id) {
        this.rooms.delete(id)
    }
}


export const roomStore = new InMemoryRoomStore()