import { app } from "./app.js";

const port = process.env.APP_PORT 

app.listen(port,()=>{
    console.log(`app listening on port ${port}`)
})
