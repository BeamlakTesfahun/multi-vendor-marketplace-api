import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';

const createVendorProfile = async (user, payload) => {
    if (user.role !== 'VENDOR') {
        throw new AppError(
            'Only vendor users can create a vendor profile.',
            403,
            'FORBIDDEN',
        );
    }

    const existingProfile = await prisma.vendor.findUnique({
        where: {
            userId: user.id,
        },
    });

    if (existingProfile) {
        throw new AppError(
            'Vendor profile already exists.',
            409,
            'VENDOR_PROFILE_EXISTS',
        );
    }

    const vendor = await prisma.vendor.create({
        data: {
            userId: user.id,
            storeName: payload.storeName,
            description: payload.description,
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                },
            },
        },
    });

    return vendor;
};

const getMyVendorProfile = async (user) => {
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

    return vendor;
};

export const vendorService = {
    createVendorProfile,
    getMyVendorProfile,
};
