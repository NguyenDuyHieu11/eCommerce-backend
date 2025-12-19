const {Types} = require('mongoose')

const convertToObjectIdMongodb = id => Types.ObjectId(id)

module.exports = {
    convertToObjectIdMongodb
}