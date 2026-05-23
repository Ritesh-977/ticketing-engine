import { mq } from '../config/rabbitmq.js';

export const startNotificationWorker = async () => {
    // Wait for RabbitMQ to connect
    await mq.connect();

    if (!mq.channel) {
        console.error('Worker failed to start: No RabbitMQ channel');
        return;
    }

    console.log('👷 Notification Worker is listening for messages...');

    // Start consuming messages from the queue
    mq.channel.consume('order_notifications', async (msg) => {
        if (msg !== null) {
            const payload = JSON.parse(msg.content.toString());

            console.log(`\n[📥 WORKER RECEIVED TASK] Processing Order ID: ${payload.orderId}`);

            try {
                // SIMULATE HEAVY LIFTING (e.g., Generating PDF, pinging webhooks, sending email)
                await new Promise((resolve) => setTimeout(resolve, 2000));

                console.log(`[✅ WORKER FINISHED] Confirmation email sent for Order: ${payload.orderId}\n`);

                // Acknowledge the message. This tells RabbitMQ to permanently delete it from the queue.
                mq.channel.ack(msg);
            } catch (error) {
                console.error('Error processing message:', error);
                // If it fails, reject the message and put it back in the queue to try again later
                mq.channel.nack(msg);
            }
        }
    });
};