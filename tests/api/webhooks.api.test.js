import { jest } from '@jest/globals';

const mockConstructEvent = jest.fn();
const mockProcessStripeEvent = jest.fn();

jest.unstable_mockModule('../../src/config/stripe.js', () => ({
    stripe: {
        webhooks: {
            constructEvent: mockConstructEvent,
        },
    },
}));

jest.unstable_mockModule(
    '../../src/modules/webhook/webhook.service.js',
    () => ({
        processStripeEvent: mockProcessStripeEvent,
    }),
);

const request = (await import('supertest')).default;
const { default: app } = await import('../../src/app.js');

describe('Webhook API route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('accepts a valid Stripe webhook and delegates processing', async () => {
        const event = {
            id: 'evt_route_test_001',
            type: 'checkout.session.completed',
            data: {
                object: {},
            },
        };

        mockConstructEvent.mockReturnValue(event);
        mockProcessStripeEvent.mockResolvedValue({
            received: true,
            duplicate: false,
            processed: true,
        });

        const response = await request(app)
            .post('/api/v1/webhooks/stripe')
            .set('stripe-signature', 'test_signature')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify(event));

        expect(response.status).toBe(200);
        expect(response.body.received).toBe(true);
        expect(response.body.processed).toBe(true);
        expect(mockConstructEvent).toHaveBeenCalledTimes(1);
        expect(mockProcessStripeEvent).toHaveBeenCalledWith(event);
    });

    it('returns an error when Stripe signature verification fails', async () => {
        mockConstructEvent.mockImplementation(() => {
            throw new Error('Invalid signature');
        });

        const response = await request(app)
            .post('/api/v1/webhooks/stripe')
            .set('stripe-signature', 'bad_signature')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({ id: 'evt_bad' }));

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
    });
});
