import amqp, { type ChannelModel, type Channel } from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

class RabbitMQConnection {
    connection!: ChannelModel;
    channel!: Channel;
    private connected = false;

    async connect() {
        if (this.connected && this.channel) return;

        try {
            const amqpUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
            this.connection = await amqp.connect(amqpUrl);
            this.channel = await this.connection.createChannel();

            // Ensure our specific queue exists before we try to send messages to it
            await this.channel.assertQueue('order_notifications', {
                durable: true // 'durable: true' means messages survive if RabbitMQ restarts
            });

            this.connected = true;
            console.log('🐇 Successfully connected to RabbitMQ');
        } catch (error) {
            console.error('❌ RabbitMQ Connection Error:', error);
        }
    }

    // Helper method to push messages to the queue
    async publish(queue: string, data: any) {
        if (!this.channel) {
            console.error('No RabbitMQ channel available');
            return;
        }
        this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
            persistent: true // Ensure messages are saved to disk until processed
        });
    }
}

export const mq = new RabbitMQConnection();