import express from 'express'
import { codeCheck, adminCheck } from '../controllers/roomController.js'

const router = express.Router()

router.get('/', (_, res) => res.json({ hello: 'world' }))
router.post('/code_check', codeCheck)
router.post('/admin_check', adminCheck)


export default router