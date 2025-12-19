require('dotenv').config() // load content of .env file as environment variables to process.env
const express = require('express')
const app = express()
const morgan = require('morgan')
const helmet = require('helmet')
const compression = require('compression')


//init middlewares
app.use(morgan('dev'))
app.use(helmet())
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// app.use(morgan('combined'))
// app.use(morgan('tiny'))
// app.use(morgan('common'))
// app.use(morgan('short'))

//init db
require('./dbs/init.mongodb')

//init routes
app.use('/', require('./routes/index'))
// app.use('/access', require('./routes/access/index'))

// handle 404
app.use((req, res, next) => {
	res.status(404).json({ message: 'Not Found' })
})

// error handler
app.use((err, req, res, next) => {
	console.error('Unhandled error:', err)
	const statusCode = err.statusCode || err.status || 500
	res.status(statusCode).json({ message: err.message || 'Internal Server Error' })
})

module.exports = app