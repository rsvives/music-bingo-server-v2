export default (io, socket) => {
    const createGame = (data) => {
        console.log('creating game')
    }

    io.on('game:create', createGame)
}
export const checkRoomDetails = async () => {

}