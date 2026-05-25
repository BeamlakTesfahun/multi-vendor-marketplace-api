import { jest } from '@jest/globals';

const mockAddOrderConfirmationEmailJob = jest.fn();

jest.unstable_mockModule('../../src/jobs/producers/email.producer.js', () => ({
    addOrderConfirmationEmailJob: mockAddOrderConfirmationEmailJob,
}));

const { prisma } = await import('../../src/config/prisma.js');
const { processStripeEvent } =
    await import('../../src/modules/webhook/webhook.service.js');

describe('Stripe webhook processing', () => {
    beforeEach(async () => {
        jest.clearAllMocks();

        await prisma.webhookEvent.deleteMany();
        await prisma.orderItem.deleteMany();
        await prisma.order.deleteMany();
        await prisma.user.deleteMany();
    });

    it('processes checkout.session.completed and marks order as paid', async () => {
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

        const event = {
            id: 'evt_test_paid_once',
            type: 'checkout.session.completed',
            data: {
                object: {
                    metadata: {
                        orderId: order.id,
                    },
                    payment_intent: 'pi_test_123',
                },
            },
        };

        const result = await processStripeEvent(event);

        expect(result.processed).toBe(true);
        expect(result.duplicate).toBe(false);

        const updatedOrder = await prisma.order.findUnique({
            where: {
                id: order.id,
            },
        });

        expect(updatedOrder.paymentStatus).toBe('PAID');
        expect(updatedOrder.status).toBe('CONFIRMED');
        expect(updatedOrder.stripePaymentIntentId).toBe('pi_test_123');
        expect(updatedOrder.paidAt).toBeTruthy();

        expect(mockAddOrderConfirmationEmailJob).toHaveBeenCalledTimes(1);
        expect(mockAddOrderConfirmationEmailJob).toHaveBeenCalledWith({
            to: user.email,
            customerName: user.fullName,
            orderId: order.id,
            totalAmount: 100,
        });

        const webhookEvents = await prisma.webhookEvent.findMany();
        expect(webhookEvents).toHaveLength(1);
    });

    it('does not process the same Stripe event twice', async () => {
        const user = await prisma.user.create({
            data: {
                fullName: 'Duplicate Test User',
                email: 'duplicate@test.com',
                password: 'hashedpassword',
                role: 'CUSTOMER',
            },
        });

        const order = await prisma.order.create({
            data: {
                userId: user.id,
                totalAmount: 150,
                status: 'PENDING',
                paymentStatus: 'PENDING',
            },
        });

        const event = {
            id: 'evt_test_duplicate_once',
            type: 'checkout.session.completed',
            data: {
                object: {
                    metadata: {
                        orderId: order.id,
                    },
                    payment_intent: 'pi_duplicate_123',
                },
            },
        };

        const firstResult = await processStripeEvent(event);
        const secondResult = await processStripeEvent(event);

        expect(firstResult.processed).toBe(true);
        expect(secondResult.duplicate).toBe(true);
        expect(secondResult.processed).toBe(false);

        const updatedOrder = await prisma.order.findUnique({
            where: {
                id: order.id,
            },
        });

        expect(updatedOrder.paymentStatus).toBe('PAID');
        expect(updatedOrder.status).toBe('CONFIRMED');

        expect(mockAddOrderConfirmationEmailJob).toHaveBeenCalledTimes(1);

        const webhookEvents = await prisma.webhookEvent.findMany({
            where: {
                stripeEventId: event.id,
            },
        });

        expect(webhookEvents).toHaveLength(1);
    });

    it('does not enqueue another email if order is already paid', async () => {
        const user = await prisma.user.create({
            data: {
                fullName: 'Already Paid User',
                email: 'paid@test.com',
                password: 'hashedpassword',
                role: 'CUSTOMER',
            },
        });

        const order = await prisma.order.create({
            data: {
                userId: user.id,
                totalAmount: 75,
                status: 'CONFIRMED',
                paymentStatus: 'PAID',
                paidAt: new Date(),
            },
        });

        const event = {
            id: 'evt_test_already_paid',
            type: 'checkout.session.completed',
            data: {
                object: {
                    metadata: {
                        orderId: order.id,
                    },
                    payment_intent: 'pi_already_paid',
                },
            },
        };

        const result = await processStripeEvent(event);

        expect(result.processed).toBe(true);
        expect(mockAddOrderConfirmationEmailJob).not.toHaveBeenCalled();

        const updatedOrder = await prisma.order.findUnique({
            where: {
                id: order.id,
            },
        });

        expect(updatedOrder.paymentStatus).toBe('PAID');
        expect(updatedOrder.status).toBe('CONFIRMED');
    });
});
