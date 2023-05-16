import express from 'express'
import { test } from '../controllers/sessionController.js';

const sessionRouter = express.Router()

sessionRouter.get('/test',test)

export default sessionRouter;

