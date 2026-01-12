'use strict'

const { getProducer } = require('../dbs/init.kafka')
const { NOTIFICATION_TYPES, TOPICS } = require('../configs/kafka.config')

/**
 * Send a notification event to Kafka
 * @param {string} type - Notification type (from NOTIFICATION_TYPES)
 * @param {string} senderId - Who triggered this (shop/system)
 * @param {string} receiverId - Target user ID
 * @param {Object} options - Additional notification data
 */
const sendNotification = async (type, senderId, receiverId, options = {}) => {
    // enforce valid type immediately
    const validTypes = Object.values(NOTIFICATION_TYPES)
    if (!validTypes.includes(type)) {
        throw new Error(`Invalid notification type: "${type}". Allowed types: ${validTypes.join(', ')}`)
    }

    try {
        const producer = await getProducer()

        const message = {
            key: String(receiverId), // Same user = same partition = ordered
            value: JSON.stringify({
                type,
                senderId,
                receiverId,
                options,
                messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString(),
            }),
        }

        await producer.send({
            topic: TOPICS.NOTIFICATION,
            messages: [message],
        })

        console.log(`📤 Notification sent [type: ${type}, to: ${receiverId}]`)
        return { success: true, messageId: JSON.parse(message.value).messageId }

    } catch (error) {
        console.error('❌ Failed to send notification:', error.message)
        throw error
    }
}

module.exports = {
    sendNotification,
}