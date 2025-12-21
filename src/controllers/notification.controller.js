'use strict'

const NotificationService = require('../services/notification.service')

class NotificationController {

    // Get notifications for authenticated user
    listNotiByUser = async (req, res, next) => {
        try {
            const userId = req.user.userId
            const { type = 'ALL', isRead = 0 } = req.query

            const result = await NotificationService.listNotiByUser({ 
                userId, 
                type, 
                isRead 
            })
            return res.status(200).json({
                message: 'Notifications fetched successfully',
                status: 'success',
                data: result
            })
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new NotificationController()
