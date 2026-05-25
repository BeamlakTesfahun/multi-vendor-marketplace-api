import { Queue } from 'bullmq';

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
};

const queueName = `email-producer-test-${Date.now()}`;

describe('Email producer idempotency', () => {
    let queue;

    beforeEach(() => {
        queue = new Queue(queueName, { connection });
    });

    afterEach(async () => {
        await queue.drain(true);
        await queue.close();
    });

    it('does not create duplicate order confirmation jobs for the same order', async () => {
        const payload = {
            to: 'customer@example.com',
            customerName: 'John Customer',
            orderId: 'order_test_001',
            totalAmount: 99.99,
        };

        const firstJob = await queue.add('order-confirmation-email', payload, {
            jobId: `order-confirmation-${payload.orderId}`,
            removeOnComplete: false,
            removeOnFail: false,
        });

        const secondJob = await queue.add('order-confirmation-email', payload, {
            jobId: `order-confirmation-${payload.orderId}`,
            removeOnComplete: false,
            removeOnFail: false,
        });

        expect(firstJob.id).toBe(secondJob.id);

        const waitingJobs = await queue.getWaiting();
        const delayedJobs = await queue.getDelayed();
        const activeJobs = await queue.getActive();

        const allPendingJobs = [...waitingJobs, ...delayedJobs, ...activeJobs];

        expect(allPendingJobs).toHaveLength(1);
        expect(allPendingJobs[0].data.orderId).toBe(payload.orderId);
    });

    it('creates separate jobs for different orders', async () => {
        const firstPayload = {
            to: 'customer@example.com',
            customerName: 'John Customer',
            orderId: 'order_test_001',
            totalAmount: 99.99,
        };

        const secondPayload = {
            to: 'customer@example.com',
            customerName: 'John Customer',
            orderId: 'order_test_002',
            totalAmount: 49.99,
        };

        const firstJob = await queue.add(
            'order-confirmation-email',
            firstPayload,
            {
                jobId: `order-confirmation-${firstPayload.orderId}`,
                removeOnComplete: false,
                removeOnFail: false,
            },
        );

        const secondJob = await queue.add(
            'order-confirmation-email',
            secondPayload,
            {
                jobId: `order-confirmation-${secondPayload.orderId}`,
                removeOnComplete: false,
                removeOnFail: false,
            },
        );

        expect(firstJob.id).not.toBe(secondJob.id);

        const waitingJobs = await queue.getWaiting();

        expect(waitingJobs).toHaveLength(2);
    });
});
