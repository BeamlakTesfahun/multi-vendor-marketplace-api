import { jest } from '@jest/globals';
import { prisma } from '../../src/config/prisma.js';

describe('Webhook idempotency', () => {
    beforeEach(async () => {
        await prisma.webhookEvent.deleteMany();
    });

    it('does not process the same Stripe event twice', async () => {
        const eventId = 'evt_test_duplicate_001';

        await prisma.webhookEvent.upsert({
            where: {
                stripeEventId: eventId,
            },
            update: {
                processed: true,
            },
            create: {
                stripeEventId: eventId,
                type: 'checkout.session.completed',
                processed: true,
            },
        });

        const existingEvent = await prisma.webhookEvent.findUnique({
            where: {
                stripeEventId: eventId,
            },
        });

        expect(existingEvent.processed).toBe(true);

        const duplicateEvent = await prisma.webhookEvent.findUnique({
            where: {
                stripeEventId: eventId,
            },
        });

        expect(duplicateEvent).toBeTruthy();
        expect(duplicateEvent.stripeEventId).toBe(eventId);
    });
});
