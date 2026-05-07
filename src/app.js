import express from 'express';
import cors from 'cors';

import routes from './routes/index.js';

import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Marketplace API is running.',
    });
});

app.use('/api/v1', routes);

app.use(notFound);

app.use(errorHandler);

export default app;
