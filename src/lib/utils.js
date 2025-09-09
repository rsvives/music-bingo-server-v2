import { randomInt, randomBytes } from 'crypto'
import bcrypt from 'bcrypt'

export function generate6DigitCode() {
    // 0..999999 uniformly, then pad leading zeros
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
}


export function generateRoomId(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
    const bytes = randomBytes(length);
    let result = "";

    for (let i = 0; i < length; i++) {
        result += chars[bytes[i] % chars.length];
    }

    return result;
}

export function findRoomsByAdminSocket(roomsMap, socketId) {
    return [...roomsMap.entries()].filter(([k, v]) => v.admin.socket === socketId).map(([k, v]) => k)
}
export function findRoomByAdminId({ roomsMap, userId }) {

    return roomsMap.size > 0 ? [...roomsMap.entries()].filter(([k, v]) => v.admin.id === userId).map(([k, v]) => k) : []
}