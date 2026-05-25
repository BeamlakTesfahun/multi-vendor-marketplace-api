import { prisma } from '../../config/prisma.js';
import { addOrderConfirmationEmailJob } from '../../jobs/producers/email.producer.js';

export const processStripeEvent = async (event) => {
    const existingEvent = await prisma.webhookEvent.findUnique({
        where: {
            stripeEventId: event.id,
        },
    });

    if (existingEvent?.processed) {
        return {
            duplicate: true,
            processed: false,
        };
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;

        if (orderId) {
            const existingOrder = await prisma.order.findUnique({
                where: {
                    id: orderId,
                },
            });

            if (existingOrder && existingOrder.paymentStatus !== 'PAID') {
                const updatedOrder = await prisma.order.update({
                    where: {
                        id: orderId,
                    },
                    data: {
                        paymentStatus: 'PAID',
                        status: 'CONFIRMED',
                        stripePaymentIntentId:
                            typeof session.payment_intent === 'string'
                                ? session.payment_intent
                                : session.payment_intent?.id,
                        paidAt: new Date(),
                    },
                    include: {
                        user: {
                            select: {
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                });

                await addOrderConfirmationEmailJob({
                    to: updatedOrder.user.email,
                    customerName: updatedOrder.user.fullName,
                    orderId: updatedOrder.id,
                    totalAmount: Number(updatedOrder.totalAmount),
                });
            }
        }
    }

    await prisma.webhookEvent.upsert({
        where: {
            stripeEventId: event.id,
        },
        update: {
            type: event.type,
            processed: true,
        },
        create: {
            stripeEventId: event.id,
            type: event.type,
            processed: true,
        },
    });

    return {
        duplicate: false,
        processed: true,
    };
};
