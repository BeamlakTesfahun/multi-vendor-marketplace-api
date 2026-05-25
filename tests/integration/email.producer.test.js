import { emailQueue } from '../../src/jobs/queues/email.queue.js';
import { addOrderConfirmationEmailJob } from '../../src/jobs/producers/email.producer.js';

describe('Email producer', () => {
    beforeEach(async () => {
        await emailQueue.drain(true);
    });

    afterAll(async () => {
        await emailQueue.close();
    });

    it('does not enqueue duplicate confirmation jobs for same order', async () => {
        const payload = {
            to: 'customer@example.com',
            customerName: 'John Customer',
            orderId: 'order_test_001',
            totalAmount: 100,
        };

        const firstJob = await addOrderConfirmationEmailJob(payload);
        const secondJob = await addOrderConfirmationEmailJob(payload);

        expect(firstJob.id).toBe(secondJob.id);

        const waitingJobs = await emailQueue.getWaiting();

        expect(waitingJobs).toHaveLength(1);
        expect(waitingJobs[0].data.orderId).toBe(payload.orderId);
    });

    it('creates separate confirmation jobs for different orders', async () => {
        const firstJob = await addOrderConfirmationEmailJob({
            to: 'customer@example.com',
            customerName: 'John Customer',
            orderId: 'order_test_001',
            totalAmount: 100,
        });

        const secondJob = await addOrderConfirmationEmailJob({
            to: 'customer@example.com',
            customerName: 'John Customer',
            orderId: 'order_test_002',
            totalAmount: 200,
        });

        expect(firstJob.id).not.toBe(secondJob.id);

        const waitingJobs = await emailQueue.getWaiting();
        expect(waitingJobs).toHaveLength(2);
    });
});
