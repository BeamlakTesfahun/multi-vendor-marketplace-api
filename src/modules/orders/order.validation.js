import { z } from 'zod';

export const orderIdParamSchema = z.object({
    body: z.object({}),
    params: z.object({
        orderId: z.string().min(1, 'Order ID is required'),
    }),
    query: z.object({}),
});
