import bcrypt from 'bcryptjs';

export const seedAdmin = async (prisma) => {
    const password = await bcrypt.hash('admin123', 10);

    await prisma.user.upsert({
        where: { email: 'admin@marketplace.com' },
        update: {},
        create: {
            fullName: 'Marketplace Admin',
            email: 'admin@marketplace.com',
            password,
            role: 'ADMIN',
        },
    });

    console.log('Admin seeded');
};
