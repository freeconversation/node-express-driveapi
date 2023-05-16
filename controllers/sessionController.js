import GoogleSession from "../Models/GoogleSession.js"

const test = async (req, res) => {
    
    const drive = new GoogleSession()
    const authed = await drive.authorize()

    return res.status(200).send("Authorization complete!")
}


export {
    test,
}

