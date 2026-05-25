import { jest } from '@jest/globals';

const mockAddOrderConfirmationEmailJob = jest.fn();

jest.unstable_mockModule('../../src/jobs/producers/email.producer.js', () => ({
    addOrderConfirmationEmailJob: mockAddOrderConfirmationEmailJob,
}));

const { prisma } = await import('../../src/config/prisma.js');

describe('Stripe webhook idempotency behavior', () => {
    beforeEach(async () => {
        jest.clearAllMocks();

        await prisma.webhookEvent.deleteMany();
        await prisma.order.deleteMany();
        await prisma.user.deleteMany();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('processes a Stripe event only once', async () => {
        const user = await prisma.user.create({
            data: {
                fullName: 'Webhook Test User',
                email: 'webhook@test.com',
                password: 'hashedpassword',
                role: 'CUSTOMER',
            },
        });

        const order = await prisma.order.create({
            data: {
                userId: user.id,
                totalAmount: 100,
                status: 'PENDING',
                paymentStatus: 'PENDING',
            },
        });

        const stripeEventId = 'evt_test_unique_001';

        const processWebhook = async () => {
            const existingEvent = await prisma.webhookEvent.findUnique({
                where: {
                    stripeEventId: stripeEventId,
                },
            });

            if (existingEvent?.processed) {
                return 'duplicate';
            }

            const updatedOrder = await prisma.order.update({
                where: {
                    id: order.id,
                },
                data: {
                    paymentStatus: 'PAID',
                    status: 'CONFIRMED',
                },
                include: {
                    user: true,
                },
            });

            await mockAddOrderConfirmationEmailJob({
                to: updatedOrder.user.email,
                customerName: updatedOrder.user.fullName,
                orderId: updatedOrder.id,
                totalAmount: Number(updatedOrder.totalAmount),
            });

            await prisma.webhookEvent.upsert({
                where: {
                    stripeEventId: stripeEventId,
                },
                update: {
                    processed: true,
                    type: 'checkout.session.completed',
                },
                create: {
                    stripeEventId: stripeEventId,
                    processed: true,
                    type: 'checkout.session.completed',
                },
            });

            return 'processed';
        };

        const firstAttempt = await processWebhook();
        const secondAttempt = await processWebhook();

        expect(firstAttempt).toBe('processed');
        expect(secondAttempt).toBe('duplicate');

        const updatedOrder = await prisma.order.findUnique({
            where: {
                id: order.id,
            },
        });

        expect(updatedOrder.paymentStatus).toBe('PAID');
        expect(updatedOrder.status).toBe('CONFIRMED');

        expect(mockAddOrderConfirmationEmailJob).toHaveBeenCalledTimes(1);

        const webhookEvents = await prisma.webhookEvent.findMany();

        expect(webhookEvents).toHaveLength(1);
        expect(webhookEvents[0].stripeEventId).toBe(stripeEventId);
    });
});
