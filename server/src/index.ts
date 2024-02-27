import * as express from 'express';
import * as cors from 'cors';
import * as path from "path";
import * as bodyParser from "body-parser";
import {router as apiRoutes} from "./routes/api";
import "./sequelize/connect";
import {redisConnect} from "./shared/services/redis.service";


const HOST = '0.0.0.0';
const PORT: number = +process.env.PORT

const app = express();
const server = require('http').createServer(app)

app.use(cors({credentials: true, origin: true}))
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

app.use('/api', apiRoutes)

app.use(express.static(path.resolve(
    path.dirname(require.main.filename), '..', 'client', 'build'
)))

app.get('*', (req, res) => {
    res.sendFile(path.resolve(path.dirname(require.main.filename), '..', 'client', 'build', 'index.html'))
})

server.listen(PORT, HOST, () => {
    console.log(`Server has been started on port:${PORT}`);
});

(async ()=>{
    await redisConnect()
})()


