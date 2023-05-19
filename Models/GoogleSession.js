import fs from "fs/promises"
import { createWriteStream, existsSync, mkdirSync } from "fs"
import { google } from "googleapis"
import { authenticate } from "@google-cloud/local-auth"
import process from 'process'

const rootPath = process.cwd()

class GoogleSession {
    #scope  
    #secretPath  
    #assetsPath  
    #tokenPath  
    #credentialsPath  
    #downloadsPath  
    #exportsPath  
    #client  
    #drive  
    #driveActivity      
    constructor() {
        this.#scope = process.env.GOOGLE_SCOPES.split(',')
        this.#secretPath = `${rootPath}${process.env.SECRET_PATH}`
        this.#assetsPath = `${rootPath}${process.env.ASSETS}`
        this.#tokenPath = `${this.#secretPath}/token.json`
        this.#credentialsPath = `${this.#secretPath}/credentials.json`
        this.#downloadsPath = `${this.#assetsPath}/downloads`
        this.#exportsPath = `${this.#assetsPath}/exports`
        this.#client = null
        this.#drive = null
        this.#driveActivity = null
        this.#init()
    }
    #init() {
        this.createFolderIfNotExist(this.#secretPath)
        this.createFolderIfNotExist(this.#exportsPath)
        this.createFolderIfNotExist(this.#downloadsPath)

    }
    get data() {
        const data = {
            scope: this.#scope,
            tokenPath: this.#tokenPath,
            credentialsPath: this.#credentialsPath
        }
        return data
    }

    get scope() {
        return this.#scope
    }
    createFolderIfNotExist(path) {
        if (!existsSync(path)) {
            mkdirSync(path, { recursive: true })
        }
    }

    async loadSavedCredentialsIfExist() {
        try {
            const content = await fs.readFile(this.#tokenPath)
            const credentials = JSON.parse(content)
            return google.auth.fromJSON(credentials)
        } catch (e) {
            console.log(e)
            return null
        }
    }
    async saveCredentials() {
        const content = await fs.readFile(this.#credentialsPath)
        const keys = JSON.parse(content)
        const key = keys.installed || keys.web;
        const payload = JSON.stringify({
            type: 'authorized#user',
            client_id: key.client_id,
            client_secret: key.client_secret,
            refresh_token: this.#client.credentials.refresh_token
        })
        try {
            await fs.writeFile(this.#tokenPath, payload)
        } catch (e) {
            throw new Error(`Error writing credentials file, err->${e}`)
        }
    }
    async authorize() {
        let client = await this.loadSavedCredentialsIfExist()
        if (client) {
            this.#client = client
            return true
        }
        client = await authenticate({
            scopes: this.#scope,
            keyfilePath: this.#credentialsPath
        })
        if (client.credentials) {
            this.#client = client
            await this.saveCredentials()
        }
        return true

    }
    async connectDrive() {
        if (!this.#client) {
            await this.authorize()
        }
        this.#drive = google.drive({ version: 'v3', auth: this.#client })
    }
    async connectDriveActivity() {
        if (!this.#client) {
            await this.authorize()
        }
        this.#driveActivity = google.driveactivity({ version: 'v2', auth: this.#client })
    }
    async checkOrConnectToDrive() {
        if (!this.#drive) {
            try {
                await this.connectDrive()
                return true
            } catch (e) {
                throw new Error(`Error connecting to drive, err->${e}`)
            }
        }
    }
    async checkOrConnectToDriveActivity() {
        if (!this.#drive) {
            try {
                await this.connectDriveActivity()
                return true
            } catch (e) {
                throw new Error(`Error connecting to drive, err->${e}`)
            }
        }
    }
    async listDriveFiles(query = {}) {
        await this.checkOrConnectToDrive()
        const res = await this.#drive.files.list(query)
        return res.data.files
    }
    async exportFileToPdfById(fileId, fileName) {
        await this.checkOrConnectToDrive()
        const dest = createWriteStream(`${this.#exportsPath}/${fileName}`)
        this.#drive.files.export({
            fileId: fileId,
            mimeType: 'application/pdf'
        }, { responseType: 'stream' }, (err, res) => {
            if (err) { throw new Error(`Error exporting Drive file, error->${err}`) }
            res.data
                .on('end', () => {
                    return true
                })
                .on('error', err => {
                    throw new Error(`Error exporting file, error->${err}`)
                })
                .pipe(dest)
        })
    }
    async downloadFileById(fileId, fileName) {
        await this.checkOrConnectToDrive()
        const dest = createWriteStream(`${this.#downloadsPath}/${fileName}`)

        this.#drive.files.get({ fileId: fileId, alt: 'media' }, { responseType: 'stream' },
            function (err, res) {
                if (err) { throw new Error(`Error getting Drive file, error->${err}`) }
                res.data
                    .on('end', () => {
                        return true

                    })
                    .on('error', err => {
                        throw new Error(`Error downloading file, error->${err}`)
                    })
                    .pipe(dest);

            }
        );
    }

    async listDriveActivity(display = 10) {
        await this.checkOrConnectToDriveActivity()
        const params = {
            pageSize: display
        }
        const res = await this.#driveActivity.activity.query({ requestBody: params })
        const act = res.data.activities
        if(!act || act.length === 0){
            return null
        }
        return act
    }  

}


export default GoogleSession