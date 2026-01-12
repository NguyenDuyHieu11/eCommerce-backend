'use strict'

const { getConsumer } = require('../dbs/init.kafka')
const { CONSUMER_GROUPS, TOPICS } = require('../configs/kafka.config')
const { handleFailedMessage } = require('../services/dlq.service')
const { handleNotification } = require('../services/notification.handler')


const notificationConsumer = async () => {
    try {
        const consumer = await getConsumer(CONSUMER_GROUPS.NOTIFICATION)

        await consumer.subscribe({
            topic: TOPICS.NOTIFICATION,
            fromBeginning: false
        })

        console.log(`🎧 Listening to topic: ${TOPICS.NOTIFICATION}`)

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const notification = JSON.parse(message.value.toString())

                console.log(`📥 [Partition ${partition}] Received:`, {
                    type: notification.type,
                    receiverId: notification.receiverId,
                    messageId: notification.messageId,
                })

                try {
                    // Process the notification
                    await handleNotification(notification)
                    console.log(`✅ Processed: ${notification.messageId}`)

                } catch (error) {
                    // Failed - send to retry topic (DLQ service handles the logic)
                    console.error(`❌ Failed to process [messageId: ${notification.messageId}]:`, error.message)
                    await handleFailedMessage(notification, error)
                }
            },
        })
    } catch (error) {
        console.error('❌ Consumer failed to start:', error.message)
        throw error
    }
}