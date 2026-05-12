import slugify from 'slugify';

import { prisma } from '../../config/prisma.js';
import { AppError } from '../../utils/AppError.js';

const createCategory = async (payload) => {
    const slug = slugify(payload.name, {
        lower: true,
        strict: true,
    });

    const existingCategory = await prisma.category.findFirst({
        where: {
            OR: [{ name: payload.name }, { slug }],
        },
    });

    if (existingCategory) {
        throw new AppError(
            'Category already exists.',
            409,
            'CATEGORY_ALREADY_EXISTS',
        );
    }

    return prisma.category.create({
        data: {
            name: payload.name,
            description: payload.description,
            slug,
        },
    });
};

const getCategories = async () => {
    return prisma.category.findMany({
        orderBy: {
            createdAt: 'desc',
        },
    });
};

const getCategoryById = async (categoryId) => {
    const category = await prisma.category.findUnique({
        where: {
            id: categoryId,
        },
    });

    if (!category) {
        throw new AppError('Category not found.', 404, 'CATEGORY_NOT_FOUND');
    }

    return category;
};

const updateCategory = async (categoryId, payload) => {
    const category = await prisma.category.findUnique({
        where: {
            id: categoryId,
        },
    });

    if (!category) {
        throw new AppError('Category not found.', 404, 'CATEGORY_NOT_FOUND');
    }

    const updatedSlug = payload.name
        ? slugify(payload.name, {
              lower: true,
              strict: true,
          })
        : category.slug;

    return prisma.category.update({
        where: {
            id: categoryId,
        },

        data: {
            name: payload.name ?? category.name,
            description: payload.description ?? category.description,
            slug: updatedSlug,
        },
    });
};

const deleteCategory = async (categoryId) => {
    const category = await prisma.category.findUnique({
        where: {
            id: categoryId,
        },
    });

    if (!category) {
        throw new AppError('Category not found.', 404, 'CATEGORY_NOT_FOUND');
    }

    await prisma.category.delete({
        where: {
            id: categoryId,
        },
    });
};

export const categoryService = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};
