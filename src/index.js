import { app, server } from "./lib/socket.js"
import authRoutes from "./routes/auth.route.js"
import roomRoutes from "./routes/room.route.js"
import dotenv from 'dotenv'
import cors from 'cors'
import express from "express"
import { redisClient } from "./lib/cache.js"

dotenv.config()
const PORT = process.env.PORT

app.use(cors({
    'origin': ['http://localhost:3000', 'https://flabingo.vercel.app/']
}))
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/room', roomRoutes)
app.get('/health', (req, res) => {
    res.send({
        status: 'ok',
        message: 'health check'
    })
})

// redisClient.connect().then(() => {
//     //console.log('Redis connected')
server.listen(PORT, () => {
    //console.log(`server running on port ${PORT}`)
})

// })