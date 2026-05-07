import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
        seed: 'node prisma/seed.js', // seeding plan
    },
    datasource: {
        url: env('DATABASE_URL'),
    },
});
