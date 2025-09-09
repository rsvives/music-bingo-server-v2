export const newPlayersMap = () => {
    const playersMap = new Map()

    return playersMap
}

export const addPlayer = ({ playersMap, user, isAdmin = false, socket }) => {
    const playerData = {
        socket: socket.id,
        ...user,
        isAdmin,
        numbers: []
    }
    playersMap.set(user.id, playerData)

    return { playersMap, player: playerData }
}

export const removePlayer = ({ userId, playersMap }) => {
    playersMap.delete(userId)
    return playersMap
}