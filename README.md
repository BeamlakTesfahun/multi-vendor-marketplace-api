# Multi-Vendor Marketplace API

A production-style backend API for a multi-vendor e-commerce marketplace built with Node.js, Express, Prisma, PostgreSQL, Redis, BullMQ, and Stripe.

This project demonstrates:

- Authentication & authorization
- Vendor onboarding and approval workflows
- Product and category management
- Shopping cart and checkout flows
- Stripe payment integration
- Webhook idempotency handling
- Redis caching
- Rate limiting
- BullMQ background jobs and workers
- Email queue processing
- Integration and API testing with Jest + Supertest

---

# Tech Stack

## Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL

## Authentication

- JWT Authentication
- Role-based authorization

## Payments

- Stripe Checkout
- Stripe Webhooks

## Queue & Background Jobs

- BullMQ
- Redis
- Nodemailer

## Caching & Performance

- Redis caching
- Rate limiting

## Testing

- Jest
- Supertest

---

# Features

## Authentication

- User registration
- User login
- Protected routes
- Role-based access control

## Vendor System

- Vendor application
- Vendor approval/rejection
- Vendor product management

## Product System

- Product CRUD
- Category management
- Product pagination
- Product filtering
- Product caching

## Cart & Checkout

- Add/remove cart items
- Quantity management
- Stripe checkout integration
- Order creation from cart
- Cart clearing after checkout

## Orders

- Order tracking
- Order items
- Payment status management
- Vendor order relationships

## Stripe Integration

- Stripe Checkout Sessions
- Webhook verification
- Webhook idempotency handling
- Duplicate event protection

## Queue System

- Email queue processing
- Retry handling
- Duplicate job prevention
- Worker failure recovery

## Testing Coverage

- Worker retry behavior
- Queue idempotency
- Webhook idempotency
- API integration tests
- Order workflow tests
- Authentication tests

---

# Project Structure

```text
src/
├── config/
├── middlewares/
├── modules/
│   ├── auth/
│   ├── vendors/
│   ├── categories/
│   ├── products/
│   ├── carts/
│   ├── orders/
│   └── webhook/
├── jobs/
│   ├── producers/
│   ├── queues/
│   └── workers/
├── routes/
└── utils/

prisma/
├── migrations/
├── seeds/
└── schema.prisma

tests/
├── api/
├── integration/
├── jobs/
└── helpers/
```

---

# Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/marketplace_db"

PORT=4444
NODE_ENV=development

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

REDIS_HOST=localhost
REDIS_PORT=6379

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

MAIL_USER=your_email@gmail.com
MAIL_PASS=your_google_app_password
MAIL_FROM=your_email@gmail.com
```

---

# Installation

## Clone Repository

```bash
git clone <repository-url>
cd multi-vendor-marketplace-api
```

## Install Dependencies

```bash
npm install
```

---

# Database Setup

## Run Prisma Migrations

```bash
npx prisma migrate dev
```

## Generate Prisma Client

```bash
npx prisma generate
```

## Seed Database

```bash
npm run seed
```

---

# Redis Setup

## Using Docker

```bash
docker run -d --name redis-dev -p 6379:6379 redis
```

Verify Redis:

```bash
docker ps
```

---

# Running the Application

## Start API Server

```bash
npm run dev
```

## Start Email Worker

```bash
npm run worker
```

---

# Stripe Webhook Setup

## Install Stripe CLI

https://stripe.com/docs/stripe-cli

## Login to Stripe

```bash
stripe login
```

## Forward Stripe Webhooks

```bash
stripe listen --forward-to localhost:4444/api/v1/webhooks/stripe
```

This forwards Stripe webhook events from Stripe servers to your local API.

---

# Running Tests

## Run All Tests

```bash
npm test
```

## Detect Open Handles

```bash
npm test -- --detectOpenHandles
```

---

# Test Coverage Areas

## Queue & Worker Tests

- Retry behavior
- Failure handling
- Duplicate job prevention
- Worker recovery

## Webhook Tests

- Stripe webhook idempotency
- Duplicate event prevention
- Order confirmation safety
- Email enqueue protection

## API Tests

- Authentication routes
- Checkout routes
- Webhook routes
- Protected route access

## Workflow Tests

- Cart → Checkout → Order
- Stock decrement behavior
- Cart clearing behavior
- Payment confirmation flow

---

# Example Commands

## Register User

```bash
curl --request POST \
  --url http://localhost:4444/api/v1/auth/register \
  --header 'Content-Type: application/json' \
  --data '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "CUSTOMER"
  }'
```

## Login

```bash
curl --request POST \
  --url http://localhost:4444/api/v1/auth/login \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

## Checkout

```bash
curl --request POST \
  --url http://localhost:4444/api/v1/orders/checkout \
  --header 'Authorization: Bearer YOUR_TOKEN'
```

---

# Important Architecture Decisions

## Webhook Idempotency

Stripe may send the same webhook event multiple times.

This project prevents:

- duplicate payment processing
- duplicate confirmation emails
- duplicate order updates

using:

- `WebhookEvent` tracking
- unique queue job IDs
- payment status checks

## Queue Reliability

BullMQ workers include:

- retry handling
- exponential backoff
- duplicate job prevention
- failure event logging

---

# Future Improvements

- Docker Compose setup
- CI/CD pipeline
- OpenAPI/Swagger documentation
- Refresh token authentication
- Product reviews
- Inventory reservation system
- Multi-image uploads
- Search indexing
- Admin analytics dashboard

---
