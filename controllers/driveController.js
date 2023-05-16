import GoogleSession from "../Models/GoogleSession.js";


const listFiles = async (req, res) => {
    const name = req.query.name ? req.query.name : null
    let query = {}
    if (name) {
        query = {
            q: `name = '${name}'`
        }
    }
    const drive = new GoogleSession()

    const files = await drive.listDriveFiles(query)
    return res.status(200).send(files)
}

const downloadOneFile = async (req, res) => {
    const fileId = req.params.fileID
    const fileName = req.query.fileName

    const drive = new GoogleSession()
    try{
        await drive.downloadFileById(fileId, fileName)
        return res.status(204).send()
    }catch(err){
        return res.status(400).send({message:`Error while trying to download file, err->${err}`})
    }


}

const exportFileById = async (req, res) => { 
    const fileId = req.params.fileID
    const fileName = req.query.fileName
    const drive = new GoogleSession()
    try{
        await drive.exportFileToPdfById(fileId, fileName)
        return res.status(204).send()

    }catch(err){
        return res.status(400).send({message:`Error while trying to export file, err->${err}`})
    }
}

const checkDriveChanges = async (req, res)=>{
    const drive = new GoogleSession()
    try{
        const changes = await drive.listDriveActivity()
        if(!changes){
            return res.status(200).send('No recent changes on drive unit')
        }
        return res.status(200).send(changes)
    }catch(err){
        return res.status(400).send(`Error checking drive changes, error->${err}`)
    }
}


export {
    listFiles,
    downloadOneFile,
    exportFileById,
    checkDriveChanges
}