import { stripe } from '../../config/stripe.js';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { addOrderConfirmationEmailJob } from '../../jobs/producers/email.producer.js';

export const handleStripeWebhook = async (req, res, next) => {
    try {
        const signature = req.headers['stripe-signature'];

        const event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            // signature,
            env.stripeWebhookSecret,
        );

        console.log('event', event);
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            const orderId = session.metadata?.orderId;

            if (orderId) {
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

        return res.status(200).json({ received: true });
    } catch (error) {
        return next(error);
    }
};
