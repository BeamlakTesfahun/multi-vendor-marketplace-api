import slugify from 'slugify';

const categories = [
    'Electronics',
    'Computers',
    'Accessories',
    'Home Office',
    'Gaming',
];

export const seedCategories = async (prisma) => {
    for (const name of categories) {
        await prisma.category.upsert({
            where: {
                slug: slugify(name, { lower: true, strict: true }),
            },
            update: {},
            create: {
                name,
                slug: slugify(name, { lower: true, strict: true }),
                description: `${name} products and related items.`,
            },
        });
    }

    console.log('Categories seeded');
};
