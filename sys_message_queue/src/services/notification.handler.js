'use strict'

const { NOTIFICATION_TYPES } = require('../configs/kafka.config')

/**
 * Handle a notification message - route to appropriate handler
 * @param {Object} notification - The notification message
 */
const handleNotification = async (notification) => {
    const { type, senderId, receiverId, options } = notification

    console.log(`🔔 Processing [${type}] for user: ${receiverId}`)

    switch (type) {
        case NOTIFICATION_TYPES.ORDER_PLACED:
            await handleOrderPlaced(notification)
            break

        case NOTIFICATION_TYPES.PAYMENT_SUCCESS:
            await handlePaymentSuccess(notification)
            break

        case NOTIFICATION_TYPES.PAYMENT_FAILED:
            await handlePaymentFailed(notification)
            break

        case NOTIFICATION_TYPES.SHIPMENT_UPDATE:
            await handleShipmentUpdate(notification)
            break

        default:
            console.warn(`⚠️ Unknown notification type: ${type}`)
    }
}

// ============================================
// Individual handlers (implement actual logic later)
// ============================================

const handleOrderPlaced = async (notification) => {
    // TODO: Save to MongoDB
    // await pushNotificationSystem({ ... })

    // TODO: Send email
    // await sendEmail(notification.receiverId, 'Your order is placed!')

    console.log(`  → Order placed for user ${notification.receiverId}`)
}

const handlePaymentSuccess = async (notification) => {
    console.log(`  → Payment success for user ${notification.receiverId}`)
}

const handlePaymentFailed = async (notification) => {
    // This one might need more urgent handling (email + push)
    console.log(`  → Payment FAILED for user ${notification.receiverId}`)
}

const handleShipmentUpdate = async (notification) => {
    console.log(`  → Shipment update for user ${notification.receiverId}`)
}

module.exports = {
    handleNotification,
}