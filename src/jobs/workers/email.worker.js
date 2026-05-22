import 'dotenv/config';
import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

const worker = new Worker(
    'email-queue',
    async (job) => {
        console.log('Worker received job:', job.id);
        console.log('Job name:', job.name);
        console.log('Job data:', job.data);

        if (job.name === 'order-confirmation-email') {
            const { to, customerName, orderId, totalAmount } = job.data;

            console.log('Sending email to:', to);

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

            console.log('Email sent successfully');
            console.log('Message ID:', info.messageId);
        }
    },
    {
        connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
        },
    },
);

worker.on('completed', (job) => {
    console.log(`Email job completed: ${job.id}`);
});

worker.on('failed', (job, error) => {
    console.error(`Email job failed: ${job?.id}`);
    console.error(error);
});

worker.on('error', (error) => {
    console.error('Worker error:', error);
});
