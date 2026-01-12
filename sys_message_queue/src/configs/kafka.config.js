'use strict'

module.exports = {
    KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'ecommerce-system',
    KAFKA_BROKERS: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),

    // Topics
    TOPICS: {
        NOTIFICATION: 'notification-topic',
        NOTIFICATION_RETRY: 'notification-retry-topic',
        NOTIFICATION_DLQ: 'notification-dlq-topic',
    },

    // Consumer groups
    CONSUMER_GROUPS: {
        NOTIFICATION: 'notification-group',
        NOTIFICATION_RETRY: 'notification-retry-group',
    },

    // Retry configuration
    RETRY: {
        MAX_ATTEMPTS: 5,
        // Delay in milliseconds for each retry attempt
        DELAYS_MS: [
            10 * 1000,      // 1st retry: 10 seconds
            30 * 1000,      // 2nd retry: 30 seconds
            60 * 1000,      // 3rd retry: 1 minute
            5 * 60 * 1000,  // 4th retry: 5 minutes
            15 * 60 * 1000, // 5th retry: 15 minutes
        ],
    },

    NOTIFICATION_TYPES: {
        ORDER_PLACED: 'ORDER_PLACED',
        PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
        PAYMENT_FAILED: 'PAYMENT_FAILED',
        SHIPMENT_UPDATE: 'SHIPMENT_UPDATE',
    },
}