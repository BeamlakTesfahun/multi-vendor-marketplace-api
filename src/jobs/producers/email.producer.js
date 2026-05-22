import { emailQueue } from '../queues/email.queue.js';

export const addOrderConfirmationEmailJob = async (payload) => {
    console.log('Adding email job to queue...', payload);

    const job = await emailQueue.add('order-confirmation-email', payload, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    });

    console.log('Email job added:', job.id);
};
