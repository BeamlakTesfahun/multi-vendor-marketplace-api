import bcrypt from 'bcryptjs';

export const seedUsers = async (prisma) => {
    const password = await bcrypt.hash('password123', 10);

    await prisma.user.upsert({
        where: { email: 'customer@example.com' },
        update: {},
        create: {
            fullName: 'John Customer',
            email: 'customer@example.com',
            password,
            role: 'CUSTOMER',
        },
    });

    await prisma.user.upsert({
        where: { email: 'vendor@example.com' },
        update: {},
        create: {
            fullName: 'Jane Vendor',
            email: 'vendor@example.com',
            password,
            role: 'VENDOR',
        },
    });

    console.log('Users seeded');
};
