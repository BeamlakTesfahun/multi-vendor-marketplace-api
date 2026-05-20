import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';

const checkout = async (user) => {
    if (user.role !== 'CUSTOMER') {
        throw new AppError(
            'Only customers can place orders.',
            403,
            'FORBIDDEN',
        );
    }

    const cart = await prisma.cart.findUnique({
        where: {
            userId: user.id,
        },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            vendor: true,
                        },
                    },
                },
            },
        },
    });

    if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty.', 400, 'EMPTY_CART');
    }

    for (const item of cart.items) {
        if (item.product.status !== 'ACTIVE') {
            throw new AppError(
                `${item.product.name} is not available for purchase.`,
                400,
                'PRODUCT_NOT_AVAILABLE',
            );
        }

        if (item.product.stock < item.quantity) {
            throw new AppError(
                `Insufficient stock for ${item.product.name}.`,
                400,
                'INSUFFICIENT_STOCK',
            );
        }
    }

    const totalAmount = cart.items.reduce((sum, item) => {
        return sum + Number(item.product.price) * item.quantity;
    }, 0);

    const order = await prisma.$transaction(async (tx) => {
        const createdOrder = await tx.order.create({
            data: {
                userId: user.id,
                totalAmount,
                status: 'PENDING',
                paymentStatus: 'PENDING',
                items: {
                    create: cart.items.map((item) => ({
                        productId: item.productId,
                        vendorId: item.product.vendorId,
                        quantity: item.quantity,
                        price: item.product.price,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                price: true,
                            },
                        },
                        vendor: {
                            select: {
                                id: true,
                                storeName: true,
                            },
                        },
                    },
                },
            },
        });

        for (const item of cart.items) {
            const updatedStock = item.product.stock - item.quantity;

            await tx.product.update({
                where: {
                    id: item.productId,
                },
                data: {
                    stock: updatedStock,
                    status:
                        updatedStock === 0
                            ? 'OUT_OF_STOCK'
                            : item.product.status,
                },
            });
        }

        await tx.cartItem.deleteMany({
            where: {
                cartId: cart.id,
            },
        });

        return createdOrder;
    });

    return order;
};

const getMyOrders = async (user) => {
    if (user.role !== 'CUSTOMER') {
        throw new AppError(
            'Only customers can view their orders.',

            403,
            'FORBIDDEN',
        );
    }

    return prisma.order.findMany({
        where: {
            userId: user.id,
        },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            price: true,
                        },
                    },
                    vendor: {
                        select: {
                            id: true,
                            storeName: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
};

const getOrderById = async (user, orderId) => {
    const order = await prisma.order.findUnique({
        where: {
            id: orderId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            price: true,
                        },
                    },
                    vendor: {
                        select: {
                            id: true,
                            storeName: true,
                            userId: true,
                        },
                    },
                },
            },
        },
    });

    if (!order) {
        throw new AppError('Order not found.', 404, 'ORDER_NOT_FOUND');
    }

    if (user.role === 'CUSTOMER' && order.userId !== user.id) {
        throw new AppError(
            'You are not allowed to access this order.',
            403,
            'FORBIDDEN',
        );
    }

    if (user.role === 'VENDOR') {
        const vendor = await prisma.vendor.findUnique({
            where: {
                userId: user.id,
            },
        });

        const hasVendorItem = order.items.some(
            (item) => item.vendorId === vendor?.id,
        );

        if (!hasVendorItem) {
            throw new AppError(
                'You are not allowed to access this order.',
                403,
                'FORBIDDEN',
            );
        }
    }

    return order;
};

const getVendorOrders = async (user) => {
    if (user.role !== 'VENDOR') {
        throw new AppError(
            'Only vendors can view vendor orders.',
            403,
            'FORBIDDEN',
        );
    }

    const vendor = await prisma.vendor.findUnique({
        where: {
            userId: user.id,
        },
    });

    if (!vendor) {
        throw new AppError(
            'Vendor profile not found.',
            404,
            'VENDOR_PROFILE_NOT_FOUND',
        );
    }

    return prisma.orderItem.findMany({
        where: {
            vendorId: vendor.id,
        },
        include: {
            order: {
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
            },
            product: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
};

export const orderService = {
    checkout,
    getMyOrders,
    getOrderById,
    getVendorOrders,
};
