import 'dotenv/config';
import nodemailer from 'nodemailer';
import { createEmailWorker } from './createEmailWorker.js';

const queueName = process.env.EMAIL_QUEUE_NAME || 'email-queue';

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

const sendEmail = async ({ to, customerName, orderId, totalAmount }) => {
    const info = await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject: 'Your order has been confirmed',
        html: `
            <h2>Order Confirmed</h2>
            <p>Hello ${customerName},</p>
            <p>Your order <strong>${orderId}</strong> has been confirmed.</p>
            <p>Total: <strong>$${totalAmount}</strong></p>
        `,
    });

    console.log('Email sent:', info.messageId);
};

const worker = createEmailWorker({
    queueName,
    connection,
    sendEmail,
});

worker.on('completed', (job) => {
    console.log(`Email job completed: ${job.id}`);
});

worker.on('failed', (job, error) => {
    console.error(`Email job failed: ${job?.id}`, error.message);
});

worker.on('error', (error) => {
    console.error('Worker error:', error);
});
