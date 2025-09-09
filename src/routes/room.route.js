import express from 'express'
import { roomCheck } from '../controllers/roomController.js'

const router = express.Router()

router.get('/', (_, res) => res.json({ hello: 'world' }))
router.post('/check', roomCheck)


export default router