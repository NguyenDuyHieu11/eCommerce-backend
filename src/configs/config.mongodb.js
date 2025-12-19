const dev = {
    app: {
        port: process.env.DEV_APP_PORT || 3052
    },
    DB : {
        port: process.env.DEV_DB_PORT || 27017,
        host: process.env.DEV_DB_HOST || 'localhost',
        name: process.env.DEV_DB_NAME || 'wsv-ecommerce',
    }
}

const prod = {
    app: {
        port: process.env.PROD_APP_PORT || 3052
    },
    DB : {
        port: process.env.PROD_DB_PORT || 27017,
        host: process.env.PROD_DB_HOST || 'localhost',
        name: process.env.PROD_DB_NAME || 'wsv-ecommerce',
    }
}

const config = process.env.NODE_ENV === 'production' ? prod : dev
module.exports = config