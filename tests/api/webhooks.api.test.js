import { jest } from '@jest/globals';

const mockConstructEvent = jest.fn();
const mockAddOrderConfirmationEmailJob = jest.fn();

jest.unstable_mockModule('../../src/config/stripe.js', () => ({
    stripe: {
        webhooks: {
            constructEvent: mockConstructEvent,
        },
    },
}));

jest.unstable_mockModule('../../src/jobs/producers/email.producer.js', () => ({
    addOrderConfirmationEmailJob: mockAddOrderConfirmationEmailJob,
}));

const request = (await import('supertest')).default;
const { default: app } = await import('../../src/app.js');
const { prisma } = await import('../../src/config/prisma.js');

describe('Stripe webhook API route', () => {
    beforeEach(async () => {
        jest.clearAllMocks();

        await prisma.webhookEvent.deleteMany();
        await prisma.orderItem.deleteMany();
        await prisma.order.deleteMany();
        await prisma.product.deleteMany();
        await prisma.category.deleteMany();
        await prisma.vendor.deleteMany();
        await prisma.user.deleteMany();
    });

    it('marks order paid, stores event, and queues email through the real webhook route', async () => {
        const user = await prisma.user.create({
            data: {
                fullName: 'Webhook Route User',
                email: 'webhook-route@test.com',
                password: 'hashed-password',
                role: 'CUSTOMER',
            },
        });

        const order = await prisma.order.create({
            data: {
                userId: user.id,
                totalAmount: 120,
                status: 'PENDING',
                paymentStatus: 'PENDING',
            },
        });

        const event = {
            id: 'evt_route_real_001',
            type: 'checkout.session.completed',
            data: {
                object: {
                    metadata: {
                        orderId: order.id,
                    },
                    payment_intent: 'pi_route_real_001',
                },
            },
        };

        mockConstructEvent.mockReturnValue(event);

        const response = await request(app)
            .post('/api/v1/webhooks/stripe')
            .set('stripe-signature', 'test_signature')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(event));

        expect(response.status).toBe(200);
        expect(response.body.received).toBe(true);
        expect(response.body.processed).toBe(true);
        expect(response.body.duplicate).toBe(false);

        const updatedOrder = await prisma.order.findUnique({
            where: {
                id: order.id,
            },
        });

        expect(updatedOrder.paymentStatus).toBe('PAID');
        expect(updatedOrder.status).toBe('CONFIRMED');
        expect(updatedOrder.stripePaymentIntentId).toBe('pi_route_real_001');
        expect(updatedOrder.paidAt).toBeTruthy();

        const webhookEvents = await prisma.webhookEvent.findMany({
            where: {
                stripeEventId: event.id,
            },
        });

        expect(webhookEvents).toHaveLength(1);
        expect(webhookEvents[0].processed).toBe(true);

        expect(mockAddOrderConfirmationEmailJob).toHaveBeenCalledTimes(1);
        expect(mockAddOrderConfirmationEmailJob).toHaveBeenCalledWith({
            to: user.email,
            customerName: user.fullName,
            orderId: order.id,
            totalAmount: 120,
        });
    });

    it('does not process duplicate Stripe webhook events through the route', async () => {
        const user = await prisma.user.create({
            data: {
                fullName: 'Duplicate Route User',
                email: 'duplicate-route@test.com',
                password: 'hashed-password',
                role: 'CUSTOMER',
            },
        });

        const order = await prisma.order.create({
            data: {
                userId: user.id,
                totalAmount: 80,
                status: 'PENDING',
                paymentStatus: 'PENDING',
            },
        });

        const event = {
            id: 'evt_route_duplicate_001',
            type: 'checkout.session.completed',
            data: {
                object: {
                    metadata: {
                        orderId: order.id,
                    },
                    payment_intent: 'pi_route_duplicate_001',
                },
            },
        };

        mockConstructEvent.mockReturnValue(event);

        const firstResponse = await request(app)
            .post('/api/v1/webhooks/stripe')
            .set('stripe-signature', 'test_signature')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(event));

        const secondResponse = await request(app)
            .post('/api/v1/webhooks/stripe')
            .set('stripe-signature', 'test_signature')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(event));

        expect(firstResponse.status).toBe(200);
        expect(secondResponse.status).toBe(200);

        expect(firstResponse.body.processed).toBe(true);
        expect(secondResponse.body.duplicate).toBe(true);
        expect(secondResponse.body.processed).toBe(false);

        const webhookEvents = await prisma.webhookEvent.findMany({
            where: {
                stripeEventId: event.id,
            },
        });

        expect(webhookEvents).toHaveLength(1);
        expect(mockAddOrderConfirmationEmailJob).toHaveBeenCalledTimes(1);
    });
});
