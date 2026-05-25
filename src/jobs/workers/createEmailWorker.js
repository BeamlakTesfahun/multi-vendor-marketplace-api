import { Worker } from 'bullmq';

export const createEmailWorker = ({ queueName, connection, sendEmail }) => {
    return new Worker(
        queueName,
        async (job) => {
            if (job.name === 'order-confirmation-email') {
                await sendEmail(job.data);
            }
        },
        {
            connection,
        },
    );
};
