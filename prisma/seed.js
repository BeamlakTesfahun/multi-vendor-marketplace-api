import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { seedAdmin } from './seeds/admin.seed.js';
import { seedUsers } from './seeds/users.seed.js';
import { seedVendors } from './seeds/vendors.seed.js';
import { seedCategories } from './seeds/categories.seed.js';
import { seedProducts } from './seeds/products.seed.js';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    await seedAdmin(prisma);
    await seedUsers(prisma);
    await seedVendors(prisma);
    await seedCategories(prisma);
    await seedProducts(prisma);

    console.log('Database seeded successfully');
}

main()
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
