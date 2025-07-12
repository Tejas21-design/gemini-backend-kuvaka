# 🚀 Gemini Backend Clone – Kuvaka Tech Assignment

This is a backend clone of a ChatGPT-like system powered by Google Gemini, built as part of the Kuvaka Tech Backend Assignment.

---

## 🛠 Tech Stack

- **Node.js + Express** – REST API backend
- **PostgreSQL (Supabase)** – Database
- **Prisma ORM** – DB schema + queries
- **JWT + OTP (mocked)** – Authentication
- **Redis (Upstash)** – Caching + queues
- **BullMQ** – Queue to process Gemini responses
- **Google Gemini API** – Generates AI responses
- **Postman** – API testing

---

## ✅ Features Implemented

| Feature                        | Status |
|-------------------------------|--------|
| OTP-based login (mocked)      | ✅     |
| JWT Authentication            | ✅     |
| `/auth/me` protected route    | ✅     |
| Chatroom Creation             | ✅     |
| Chatroom Listing (Redis Cache)| ✅     |
| View Chatroom + Messages      | ✅     |
| Send message (user)           | ✅     |
| Queue Gemini reply async      | ✅     |

---

## 📦 Project Setup

### 🔧 Environment Variables

Create a `.env` file with the following:

```env
DATABASE_URL=your_supabase_pg_url
JWT_SECRET=your_jwt_secret
REDIS_URL=your_upstash_redis_url
GEMINI_API_KEY=your_google_gemini_api_key

📥 Install & Run
bash

npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev


In a second terminal:

bash
node queue/worker.js

🧪 API Testing – Postman
Import the Postman collection:
gemini-kuvaka.postman_collection.json

Includes:

/auth/signup, /auth/send-otp, /auth/verify-otp
/auth/me, /chatroom, /chatroom/:id
/chatroom/:id/message

📁 Folder Structure
bash

routes/           # Express route files
prisma/           # Prisma client setup
queue/            # BullMQ queue + Gemini worker
utils/            # JWT, Redis helpers
.env              # Secrets (not committed)

📌 Notes
OTP is mocked, returned directly in response (no SMS)
Gemini responses are queued to avoid blocking user flow
Redis is used for caching /chatroom and BullMQ queue
Prisma handles all DB access and migrations
