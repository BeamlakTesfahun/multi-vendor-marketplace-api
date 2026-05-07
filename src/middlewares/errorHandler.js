import { AppError } from '../utils/AppError.js';

export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Something went wrong';
    let code = err.code || 'INTERNAL_SERVER_ERROR';
    let details = err.details || null;

    if (!(err instanceof AppError)) {
        statusCode = 500;
        message = 'Internal Server Error';
        code = 'INTERNAL_SERVER_ERROR';
        details = null;
    }

    res.status(statusCode).json({
        success: false,
        message,
        code,
        details,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};
