'use strict'

const notificationModel = require("../models/notification.model");
const { notification } = require("../models/notification.model");

const pushNotificationSystem = async ({
    type = 'SHOP-001',
    senderId = 1,
    receiverId = 1,
    options = {}
}) => {
    let noti_content;

    if(type === 'SHOP-001') {
        noti_content = `@@@ vua moi them 1 san pham: @@@@`
    }
    else if (type === 'PROMOTION-001') {
        noti_content = `@@@ vua moi them 1 vouver: @@@@@`
    }

    const newNoti = await notification.create({
        noti_content,
        noti_type: type,
        noti_senderId: senderId,
        noti_receiverId: receiverId,
        noti_options: options
    })
    return newNoti
}

const listNotiByUser = async({
    userId = 1,
    type = 'ALL',
    isRead = 0
}) => {
    const match = { not_receivedId: userId }
    if (type !== 'ALL') {
        match['noti_type'] = type
    }

    return await notificationModel.aggregate([
        {
            $match: match
        },
        {
            $project: {
                noti_type: 1,
                noti_senderId: 1,
                noti_receiverId: 1,
                noti_content: 1,
                createdAt: 1,
            }
        },
        
    ])

}

module.exports = {
    pushNotificationSystem,
    listNotiByUser
}