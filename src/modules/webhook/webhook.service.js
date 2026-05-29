import { prisma } from '../../config/prisma.js';
import { addOrderConfirmationEmailJob } from '../../jobs/producers/email.producer.js';

const confirmInventoryReservations = async (tx, orderId) => {
    await tx.inventoryReservation.updateMany({
        where: {
            orderId,
            status: 'ACTIVE',
        },
        data: {
            status: 'CONFIRMED',
        },
    });
};

const releaseInventoryReservations = async (tx, order) => {
    const activeReservations = order.inventoryReservations.filter(
        (reservation) => reservation.status === 'ACTIVE',
    );

    for (const reservation of activeReservations) {
        await tx.product.update({
            where: {
                id: reservation.productId,
            },
            data: {
                stock: {
                    increment: reservation.quantity,
                },
                status: 'ACTIVE',
            },
        });
    }

    await tx.inventoryReservation.updateMany({
        where: {
            orderId: order.id,
            status: 'ACTIVE',
        },
        data: {
            status: 'EXPIRED',
        },
    });
};

const handleCheckoutCompleted = async (event) => {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
        return;
    }

    const order = await prisma.order.findUnique({
        where: {
            id: orderId,
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

    if (!order) {
        return;
    }

    if (order.paymentStatus === 'PAID') {
        return;
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
        const paidOrder = await tx.order.update({
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

        await confirmInventoryReservations(tx, orderId);

        return paidOrder;
    });

    await addOrderConfirmationEmailJob({
        to: updatedOrder.user.email,
        customerName: updatedOrder.user.fullName,
        orderId: updatedOrder.id,
        totalAmount: Number(updatedOrder.totalAmount),
    });
};

const handleCheckoutExpired = async (event) => {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
        return;
    }

    const order = await prisma.order.findUnique({
        where: {
            id: orderId,
        },
        include: {
            inventoryReservations: true,
        },
    });

    if (!order) {
        return;
    }

    if (order.status !== 'PENDING' || order.paymentStatus !== 'PENDING') {
        return;
    }

    await prisma.$transaction(async (tx) => {
        await releaseInventoryReservations(tx, order);

        await tx.order.update({
            where: {
                id: orderId,
            },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
            },
        });
    });
};

export const processStripeEvent = async (event) => {
    const existingEvent = await prisma.webhookEvent.findUnique({
        where: {
            stripeEventId: event.id,
        },
    });

    if (existingEvent?.processed) {
        return {
            received: true,
            duplicate: true,
            processed: false,
        };
    }

    if (event.type === 'checkout.session.completed') {
        await handleCheckoutCompleted(event);
    }

    if (event.type === 'checkout.session.expired') {
        await handleCheckoutExpired(event);
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
        received: true,
        duplicate: false,
        processed: true,
    };
};
