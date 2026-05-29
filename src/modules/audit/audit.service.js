import { prisma } from '../../config/prisma.js';

export const createAuditLog = async ({
    userId = null,
    action,
    entityType,
    entityId = null,
    metadata = null,
}) => {
    return prisma.auditLog.create({
        data: {
            userId,
            action,
            entityType,
            entityId,
            metadata,
        },
    });
};
