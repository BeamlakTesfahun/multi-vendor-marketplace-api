import slugify from 'slugify';

const products = [
    {
        name: 'Wireless Mouse',
        price: 24.99,
        stock: 50,
        category: 'Accessories',
    },
    { name: 'Gaming Keyboard', price: 79.99, stock: 30, category: 'Gaming' },
    {
        name: 'Bluetooth Speaker',
        price: 49.99,
        stock: 40,
        category: 'Electronics',
    },
    { name: 'USB-C Hub', price: 34.99, stock: 60, category: 'Computers' },
    { name: 'Laptop Stand', price: 29.99, stock: 35, category: 'Home Office' },
    {
        name: 'Noise Cancelling Headphones',
        price: 129.99,
        stock: 20,
        category: 'Electronics',
    },
    { name: 'Smart Watch', price: 149.99, stock: 25, category: 'Electronics' },
    {
        name: 'Portable Charger',
        price: 39.99,
        stock: 45,
        category: 'Accessories',
    },
    {
        name: 'Mechanical Keyboard',
        price: 99.99,
        stock: 22,
        category: 'Gaming',
    },
    { name: 'Webcam HD', price: 59.99, stock: 38, category: 'Computers' },
    { name: 'External SSD', price: 119.99, stock: 18, category: 'Computers' },
    {
        name: 'Wireless Charger',
        price: 19.99,
        stock: 70,
        category: 'Accessories',
    },
    { name: 'Desk Lamp', price: 27.99, stock: 33, category: 'Home Office' },
    { name: 'Monitor Arm', price: 89.99, stock: 15, category: 'Home Office' },
    { name: 'Gaming Chair', price: 199.99, stock: 10, category: 'Gaming' },
];

export const seedProducts = async (prisma) => {
    const vendor = await prisma.vendor.findFirst({
        where: { status: 'APPROVED' },
    });

    if (!vendor) {
        throw new Error('No approved vendor found. Seed vendors first.');
    }

    for (const product of products) {
        const category = await prisma.category.findUnique({
            where: {
                slug: slugify(product.category, { lower: true, strict: true }),
            },
        });

        if (!category) continue;

        const slug = slugify(product.name, { lower: true, strict: true });

        await prisma.product.upsert({
            where: { slug },
            update: {
                price: product.price,
                stock: product.stock,
                status: 'ACTIVE',
            },
            create: {
                vendorId: vendor.id,
                categoryId: category.id,
                name: product.name,
                slug,
                description: `${product.name} seeded test product.`,
                price: product.price,
                stock: product.stock,
                status: 'ACTIVE',
            },
        });
    }

    console.log('Products seeded');
};
