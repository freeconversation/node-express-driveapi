import {Router} from 'express'
import { 
    listFiles, 
    downloadOneFile,
    exportFileById,
    checkDriveChanges
 } from '../controllers/driveController.js'

const driveRoutes = Router()

driveRoutes.get('/list', listFiles)
driveRoutes.get('/download/:fileID',downloadOneFile)
driveRoutes.get('/export/:fileID',exportFileById)
driveRoutes.get('/changes',checkDriveChanges )


export default driveRoutes