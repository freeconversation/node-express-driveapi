import fs from "fs/promises"
import { createWriteStream, existsSync, mkdirSync } from "fs"
import { google } from "googleapis"
import { authenticate } from "@google-cloud/local-auth"
import process from 'process'

const rootPath = process.cwd()

class GoogleSession {
    constructor() {
        this._scope = process.env.GOOGLE_SCOPES.split(',')
        this._secretPath = `${rootPath}${process.env.SECRET_PATH}`
        this._assetsPath = `${rootPath}${process.env.ASSETS}`
        this._tokenPath = `${this._secretPath}/token.json`
        this._credentialsPath = `${this._secretPath}/credentials.json`
        this._downloadsPath = `${this._assetsPath}/downloads`
        this._exportsPath = `${this._assetsPath}/exports`
        this._client = null
        this._drive = null
        this._driveActivity = null
        this.init()
    }
    init() {
        this.createFolderIfNotExist(this._secretPath)
        this.createFolderIfNotExist(this._exportsPath)
        this.createFolderIfNotExist(this._downloadsPath)

    }
    get data() {
        const data = {
            scope: this._scope,
            tokenPath: this._tokenPath,
            credentialsPath: this._credentialsPath
        }
        return data
    }

    get scope() {
        return this._scope
    }
    createFolderIfNotExist(path) {
        if (!existsSync(path)) {
            mkdirSync(path, { recursive: true })
        }
    }

    async loadSavedCredentialsIfExist() {
        try {
            const content = await fs.readFile(this._tokenPath)
            const credentials = JSON.parse(content)
            return google.auth.fromJSON(credentials)
        } catch (e) {
            console.log(e)
            return null
        }
    }
    async saveCredentials() {
        const content = await fs.readFile(this._credentialsPath)
        const keys = JSON.parse(content)
        const key = keys.installed || keys.web;
        const payload = JSON.stringify({
            type: 'authorized_user',
            client_id: key.client_id,
            client_secret: key.client_secret,
            refresh_token: this._client.credentials.refresh_token
        })
        try {
            await fs.writeFile(this._tokenPath, payload)
        } catch (e) {
            throw new Error(`Error writing credentials file, err->${e}`)
        }
    }
    async authorize() {
        let client = await this.loadSavedCredentialsIfExist()
        if (client) {
            this._client = client
            return true
        }
        client = await authenticate({
            scopes: this._scope,
            keyfilePath: this._credentialsPath
        })
        if (client.credentials) {
            this._client = client
            await this.saveCredentials()
        }
        return true

    }
    async connectDrive() {
        if (!this._client) {
            await this.authorize()
        }
        this._drive = google.drive({ version: 'v3', auth: this._client })
    }
    async connectDriveActivity() {
        if (!this._client) {
            await this.authorize()
        }
        this._driveActivity = google.driveactivity({ version: 'v2', auth: this._client })
    }
    async checkOrConnectToDrive() {
        if (!this._drive) {
            try {
                await this.connectDrive()
                return true
            } catch (e) {
                throw new Error(`Error connecting to drive, err->${e}`)
            }
        }
    }
    async checkOrConnectToDriveActivity() {
        if (!this._drive) {
            try {
                await this.connectDriveActivity()
                return true
            } catch (e) {
                throw new Error(`Error connecting to drive, err->${e}`)
            }
        }
    }
    async listDriveFiles(query = {}) {
        await this.checkOrConnectToDrive()()
        const res = await this._drive.files.list(query)
        return res.data.files
    }
    async exportFileToPdfById(fileId, fileName) {
        await this.checkOrConnectToDrive()()
        const dest = createWriteStream(`${this._exportsPath}/${fileName}`)
        this._drive.files.export({
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
        await this.checkOrConnectToDrive()()
        const dest = createWriteStream(`${this._downloadsPath}/${fileName}`)

        this._drive.files.get({ fileId: fileId, alt: 'media' }, { responseType: 'stream' },
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
        const res = await this._driveActivity.activity.query({ requestBody: params })
        const act = res.data.activities
        if(!act || act.length === 0){
            return null
        }
        return act
    }  

}


export default GoogleSession