# Ticketing Engine as a Service (TEaaS)

A high-concurrency, multi-tenant flash-sale and inventory engine built as an infrastructure service for external developers. TEaaS solves complex backend engineering problems like race conditions, distributed locking, and asynchronous processing to allow external platforms to handle massive traffic spikes (e.g., concert ticket drops, limited merchandise sales) without server crashes.

## 🚀 Architecture & Tech Stack

This project is built using a modern, strictly-typed microservices architecture.

* **Core API:** Node.js (v24+) & TypeScript (ES Modules)
* **Framework:** Express.js
* **Primary Database:** PostgreSQL (Containerized)
* **Migrations:** `node-pg-migrate` (Raw SQL)
* **Security:** API Key Authentication with `bcrypt` hashing, Helmet, CORS
* **Infrastructure:** Docker & Docker Compose

*(Future phases include Redis for distributed locking and RabbitMQ for asynchronous webhook processing).*

## 🎯 Core Features

* **Multi-Tenant Isolation:** External developers register as tenants and receive isolated API Keys.
* **Cryptographic Security:** Secret keys are generated once, hashed via `bcrypt` (cost 10), and verified via custom Express middleware.
* **Idempotent Operations:** Built-in safeguards at the database level to prevent double-charging and double-bookings.
* **Automated Migrations:** Database schemas are version-controlled and applied programmatically.

## 🛠️ Local Development Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v24 or higher recommended)
* [Docker Desktop](https://www.docker.com/products/docker-desktop)
* A database client like DBeaver (optional but recommended)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd ticketing-engine
npm install
