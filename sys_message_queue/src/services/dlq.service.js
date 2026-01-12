'use strict'

const { getProducer } = require('../dbs/init.kafka')
const { TOPICS, RETRY } = require('../configs/kafka.config')

/**
 * Handle a failed message - either retry or send to DLQ
 * @param {Object} message - The original message
 * @param {Error} error - The error that occurred
 * @returns {Promise<{action: string, retryCount: number}>}
 */
const handleFailedMessage = async (message, error) => {
    const retryCount = (message.retryCount || 0) + 1

    if (retryCount <= RETRY.MAX_ATTEMPTS) {
        // Still have retries left - send to retry topic
        await sendToRetry(message, error, retryCount)
        return { action: 'retry', retryCount }
    } else {
        // Max retries exhausted - send to DLQ
        await sendToDLQ(message, error, retryCount)
        return { action: 'dlq', retryCount }
    }
}

/**
 * Send message to retry topic with delay
 * @param {Object} message - The original message
 * @param {Error} error - The error that occurred
 * @param {number} retryCount - Current retry attempt
 */
const sendToRetry = async (message, error, retryCount) => {
    const producer = await getProducer()

    // Calculate delay based on retry count (0-indexed for array)
    const delayMs = RETRY.DELAYS_MS[retryCount - 1] || RETRY.DELAYS_MS[RETRY.DELAYS_MS.length - 1]
    const processAfter = new Date(Date.now() + delayMs).toISOString()

    const retryMessage = {
        ...message,
        retryCount,
        processAfter,
        lastError: error.message,
        lastFailedAt: new Date().toISOString(),
    }

    await producer.send({
        topic: TOPICS.NOTIFICATION_RETRY,
        messages: [{
            key: String(message.receiverId),
            value: JSON.stringify(retryMessage),
        }],
    })

    console.log(`🔄 Retry scheduled [attempt: ${retryCount}/${RETRY.MAX_ATTEMPTS}, processAfter: ${processAfter}]`)
}

/**
 * Send message to Dead Letter Queue
 * @param {Object} message - The original message
 * @param {Error} error - The error that occurred
 * @param {number} retryCount - Final retry count
 */
const sendToDLQ = async (message, error, retryCount) => {
    const producer = await getProducer()

    const dlqMessage = {
        ...message,
        retryCount,
        finalError: error.message,
        deadAt: new Date().toISOString(),
        // Include stack trace for debugging
        errorStack: error.stack,
    }

    await producer.send({
        topic: TOPICS.NOTIFICATION_DLQ,
        messages: [{
            key: String(message.receiverId),
            value: JSON.stringify(dlqMessage),
        }],
    })

    // 🚨 This is where you'd alert (Slack, PagerDuty, etc.)
    console.error(`☠️ Message sent to DLQ [messageId: ${message.messageId}]`)
    console.error(`   Error: ${error.message}`)
    console.error(`   Attempts: ${retryCount}`)
}

/**
 * Check if a retry message is ready to be processed
 * @param {Object} message - The message with processAfter
 * @returns {boolean}
 */
const isReadyToProcess = (message) => {
    if (!message.processAfter) return true
    return new Date() >= new Date(message.processAfter)
}

/**
 * Calculate remaining wait time for a message
 * @param {Object} message - The message with processAfter
 * @returns {number} - Milliseconds to wait (0 if ready)
 */
const getWaitTimeMs = (message) => {
    if (!message.processAfter) return 0
    const waitTime = new Date(message.processAfter) - new Date()
    return Math.max(0, waitTime)
}

module.exports = {
    handleFailedMessage,
    sendToRetry,
    sendToDLQ,
    isReadyToProcess,
    getWaitTimeMs,
}

