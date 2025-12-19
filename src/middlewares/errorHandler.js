const AppError = require('../error/AppError');

// dev error
const sendErrorDev =  (err, req, res) => {
    res.status(err.statusCode || 500).json({
        status: err.status,
        message: err.message,
        stack: err.stack,
        error: err
    })
}

// Production error response (hide internals)
const sendErrorProd =  (err, req, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
        })
    }
    else {
        // programming or unknown error
        res.status(500).json({
            status: 'error',
            message: 'mehhhhh'
        })
    }
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.status || 500
    err.status = err.status || 'error'

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res)
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err }
        error.message = err.message

        // handle specific errors here if needed

        sendErrorProd(error, req, res)
    }
}

