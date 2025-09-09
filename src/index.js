import { app, server } from "./lib/socket.js"
import authRoutes from "./routes/auth.route.js"
import roomRoutes from "./routes/room.route.js"
import dotenv from 'dotenv'
import cors from 'cors'
import express from "express"


import { redisClient } from "./lib/cache.js"


dotenv.config()


const PORT = process.env.PORT
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)
// app.get('/', (req, res) => res.send('hello'))
// app.get('/ping', (req, res) => res.json({ msg: 'pong' }).send())
// app.post('/room/check', roomCheck)
app.use('/api/room', roomRoutes)


redisClient.connect().then(() => {
    console.log('Redis connected')
    server.listen(PORT, () => {
        console.log(`server running on port ${PORT}`)
    })

})