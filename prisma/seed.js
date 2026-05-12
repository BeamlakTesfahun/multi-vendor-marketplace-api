import 'dotenv/config';
import bcrypt from 'bcryptjs';

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const existingAdmin = await prisma.user.findUnique({
        where: {
            email: 'admin@marketplace.com',
        },
    });

    if (existingAdmin) {
        console.log('Admin already exists.');
        return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.create({
        data: {
            fullName: 'Marketplace Admin',
            email: 'admin@marketplace.com',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    console.log('Admin seeded successfully.');
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
