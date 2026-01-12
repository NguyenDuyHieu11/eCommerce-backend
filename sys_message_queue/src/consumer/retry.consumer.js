'use strict'

const { getConsumer } = require('../dbs/init.kafka')
const { CONSUMER_GROUPS, TOPICS } = require('../configs/kafka.config')
const { handleFailedMessage, isReadyToProcess, getWaitTimeMs } = require('../services/dlq.service')
const { handleNotification } = require('../services/notification.handler')

/**
 * Retry Consumer - Processes messages from the retry topic
 * 
 * Key behavior:
 * - Checks if message is ready to process (based on processAfter)
 * - If not ready, pauses briefly then continues
 * - If ready, attempts to process
 * - On success: message is done (self-healed!)
 * - On failure: goes back through DLQ service (retry again or DLQ)
 */
const retryConsumer = async () => {
    try {
        const consumer = await getConsumer(CONSUMER_GROUPS.NOTIFICATION_RETRY)

        await consumer.subscribe({
            topic: TOPICS.NOTIFICATION_RETRY,
            fromBeginning: false,
        })

        console.log(`🔄 Retry Consumer listening to: ${TOPICS.NOTIFICATION_RETRY}`)

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const notification = JSON.parse(message.value.toString())

                console.log(`🔄 [Retry] Received [attempt: ${notification.retryCount}]`, {
                    type: notification.type,
                    messageId: notification.messageId,
                    processAfter: notification.processAfter,
                })

                // Check if message is ready to be processed
                if (!isReadyToProcess(notification)) {
                    const waitTime = getWaitTimeMs(notification)
                    console.log(`⏳ Message not ready. Waiting ${Math.round(waitTime / 1000)}s...`)
                    
                    // Wait until ready (simple approach)
                    // In production, you might use a more sophisticated approach
                    await sleep(waitTime)
                }

                try {
                    // Attempt to process the message
                    await handleNotification(notification)

                    // Success! Self-healed - no alert needed
                    console.log(`✅ [Retry] Self-healed! [attempt: ${notification.retryCount}, messageId: ${notification.messageId}]`)

                } catch (error) {
                    // Still failing - let DLQ service decide next step
                    console.error(`❌ [Retry] Still failing [attempt: ${notification.retryCount}]:`, error.message)
                    await handleFailedMessage(notification, error)
                }
            },
        })
    } catch (error) {
        console.error('❌ Retry Consumer failed to start:', error.message)
        throw error
    }
}

/**
 * Simple sleep utility
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

module.exports = { retryConsumer }

