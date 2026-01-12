'use strict';

const { Kafka } = require('kafkajs');
const config = require('../configs/kafka.config');

let kafkaInstance = null;
let producer = null;
// let consumer = null; ???

/**
 * Initialize Kafka client (singleton)
 */
const getKafkaInstance = () => {
    if (!kafkaInstance) {
        kafkaInstance = new Kafka({
            clientId: config.KAFKA_CLIENT_ID,
            brokers: config.KAFKA_BROKERS,
        });
    }
    return kafkaInstance;
};

/**
 * Get or create producer (singleton)
 */
const getProducer = async () => {
    if (!producer) {
        const kafka = getKafkaInstance();
        producer = kafka.producer();
        await producer.connect();
        console.log('✅ Kafka Producer connected');
    }
    return producer;
};

/**
 * Get or create consumer for a specific group
 */
const getConsumer = async (groupId) => {
    const kafka = getKafkaInstance();
    const newConsumer = kafka.consumer({ groupId });
    await newConsumer.connect();
    console.log(`✅ Kafka Consumer connected [group: ${groupId}]`);
    return newConsumer;
};

/**
 * Disconnect all connections
 */
const disconnectAll = async () => {
    if (producer) {
        await producer.disconnect();
        producer = null;
        console.log('🔌 Kafka Producer disconnected');
    }
    // if (consumer) {
    //     await consumer.disconnect();
    //     consumer = null;
    //     console.log('🔌 Kafka Consumer disconnected');
    // }
};

module.exports = {
    getKafkaInstance,
    getProducer,
    getConsumer,
    disconnectAll,
};
