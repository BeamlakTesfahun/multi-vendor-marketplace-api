import { emailQueue } from '../queues/email.queue.js';

export const addOrderConfirmationEmailJob = async (payload) => {
    const job = await emailQueue.add('order-confirmation-email', payload, {
        jobId: `order-confirmation-${payload.orderId}`,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: {
            age: 3600,
            count: 1000,
        },
        removeOnFail: false,
    });

    return job;
};
