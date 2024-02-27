import {errorHandler} from '../utils/errorHandler'


export const login = async (req, res) => {
    try {
        if (req.body.login === process.env.ADMIN_NAME && req.body.password === process.env.ADMIN_PASSWORD) {
            res.status(200).json({
                success: true,
                token: process.env.APITOKEN.trim()
            })
        } else {
            res.status(404).json({
                success: false,
                message: 'Incorrect login or password'
            })
        }
    } catch (e) {
        errorHandler(res, e)
    }
}


