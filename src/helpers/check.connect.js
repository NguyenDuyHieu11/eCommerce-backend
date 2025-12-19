'use strict'

const { count } = require('console')
const mongoose = require('mongoose')
const os = require('os')
const process = require('process')
const _SECONDS = 5000 
// const countConnections = async () => {
//     try {
//         const admin = mongoose.connection.db.admin()
//         const status = await admin.serverStatus()
//         return status.connections // { current, available, totalCreated, ... }
//     } catch (error) {
//         console.error('Error fetching connection stats:', error)
//         return null
//     }
// }

const countConnections = () => {
    const numConnections = mongoose.connections.length
    return numConnections
    console.log('Number of active connections:', numConnections)
}

// check connections overload
const checkOverload = () => {
    setInterval( () => {
        const numConnections = countConnections()
        const numCores = os.cpus().length // number of CPU cores
        const memoryUsage = process.memoryUsage().rss
        const maxConnections = numCores * 1000 // example threshold, need to adjust based on infrastructure

        if (numConnections > maxConnections) {
            console.warn('Warning: High number of connections detected!')
            // Here you can add logic to handle overload, e.g., send alerts, scale resources, etc.
        }
        
        console.log(`Connections: ${numConnections}, CPU Cores: ${numCores}, Memory Usage: ${memoryUsage}`)
    }, _SECONDS)
}

module.exports = {
    countConnections, checkOverload
}

