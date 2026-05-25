import 'dotenv/config';
import { prisma } from '../src/config/prisma.js';

beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test') {
        throw new Error('Tests must run with NODE_ENV=test');
    }
});

afterAll(async () => {
    await prisma.$disconnect();
});
