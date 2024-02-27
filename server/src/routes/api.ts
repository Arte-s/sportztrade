import * as express from 'express';
import {
    login,
} from "../controllers/api";

const tokenValue = process.env.APITOKEN;
const tokenCheck = function (req, res, next) {
    const token = req.headers['access-token'];
    if (token && token === tokenValue) {
        next();
    } else {
        return res.status(403).send({
            success: false,
            message: 'No token provided or token invalid'
        });
    }
};


const router = express.Router()

router.post('/auth/login', login)

//admin
// router.post('/clients', tokenCheck, getClients)


export {router}
