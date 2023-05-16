import express from "express";
import bodyParser from "body-parser";
import logger from "morgan";
import dotenv from "dotenv"

import sessionRouter from "./routes/sessionRoutes.js";
import driveRoutes from "./routes/driveRoutes.js";


const SETTINGS = dotenv.config()

const app = express()

app.set('env', SETTINGS.parsed.ENV)
app.set('config', SETTINGS.parsed)
app.locals.env = app.get('env')
app.locals.config = app.get('config')

app.use(logger('combined'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use('/session', sessionRouter)
app.use('/drive', driveRoutes)


export { app }
