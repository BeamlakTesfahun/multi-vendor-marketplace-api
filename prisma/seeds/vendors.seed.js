export const seedVendors = async (prisma) => {
    const vendorUser = await prisma.user.findUnique({
        where: { email: 'vendor@example.com' },
    });

    if (!vendorUser) {
        throw new Error('Vendor user not found. Seed users first.');
    }

    await prisma.vendor.upsert({
        where: { userId: vendorUser.id },
        update: {
            status: 'APPROVED',
        },
        create: {
            userId: vendorUser.id,
            storeName: 'Jane Tech Store',
            description: 'A vendor store for tech products and accessories.',
            status: 'APPROVED',
        },
    });

    console.log('Vendors seeded');
};
