# Bluefins Aquatic Solutions - Backend Server

Backend API for Bluefins Swimming Academy management system.

## Quick start (simple)

If you only want to start the backend API on your computer:

```bash
cd server
npm install
npm run dev
```

Plain English: “Download what the server needs, then start it.”

For the full non‑technical guide (including starting the frontend website), see `../docs/START_HERE.md`.

## Features
- Contact form management with feedback storage
- Posts/Announcements management with Cloudinary integration
- Team worksheets and resource sharing
- MongoDB database integration
- RESTful API endpoints

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Atlas)
- **ODM:** Mongoose
- **Authentication:** JWT
- **Email:** Nodemailer

## API Endpoints

### Feedback
- `GET /api/feedback` - Get all feedback
- `POST /api/feedback` - Create new feedback
- `PATCH /api/feedback/:id` - Update feedback status
- `DELETE /api/feedback/:id` - Delete feedback

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `DELETE /api/posts/:id` - Delete post

### Worksheets
- `GET /api/worksheets` - Get all worksheets
- `POST /api/worksheets` - Create new worksheet
- `PATCH /api/worksheets/:id/click` - Track link clicks
- `DELETE /api/worksheets/:id` - Delete worksheet

## Environment Variables

Create a `.env` file in the `server/` directory (see `.env.example`):

```env
PORT=8000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
NODE_ENV=production
JWT_SECRET=your_secret_key

# Razorpay (required for live payments)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxx
# Required only if you enable Razorpay webhooks
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx

# Optional: show gateway fee + GST to customer
PAYMENT_COMMISSION_PCT=2
PAYMENT_COMMISSION_FLAT_INR=0
PAYMENT_GST_PCT=18

# Testing only: force ONLINE payment total (Razorpay) to ₹1
# This is intentionally gated so you can't accidentally ship ₹1 pricing.
ENABLE_TEST_MODE=true
FORCE_TEST_AMOUNT_INR=1
```

## Installation

```bash
npm install
```

## Running Locally

```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

## Admin Accounts (Developer)

Admins are stored in MongoDB in the `admins` collection (`adminId`, optional email, and a bcrypt password hash).

Create/update an admin (single command):

```bash
cd server
npm run create-admin -- --id "owner" --password "MyPass123" --role superadmin
npm run create-admin -- --id "testadmin" --password "ResetPass" --role admin --update
```

Secure usage (recommended; prompts for password so it isn't stored in shell history):

```bash
cd server
npm run create-admin -- --id "owner" --role superadmin
```

Create admin in code (developer seed):

- Edit the `ADMIN` object in [src/scripts/seedAdmin.js](src/scripts/seedAdmin.js)
- Run:

```bash
cd server
npm run seed-admin
```

## Membership Plans (Seeding)

Seed the official membership + coaching plans (as per the poster):

```bash
cd server
npm run seed-poster-plans
```

Developer-only: seed a ₹1 test plan for payment flow testing:

```bash
cd server
npm run seed-test-plan
```

## Deployment

### Deploy to Render/Railway/Vercel

1. Push code to GitHub
2. Connect your repository to hosting platform
3. Set environment variables in platform dashboard
4. Deploy

### Environment Variables for Production
- `PORT` - Server port (usually auto-assigned by host)
- `MONGO_URI` - MongoDB Atlas connection string
- `NODE_ENV` - Set to `production`
- `JWT_SECRET` - Strong secret key for JWT

## Database
Uses MongoDB Atlas cloud database. Make sure your IP is whitelisted in MongoDB Atlas Network Access.

## CORS
CORS is enabled for all origins. Update in production for specific domains:

```javascript
app.use(cors({
  origin: 'https://yourdomain.com'
}))
```

## Author
Deepak Digital Craft

## License
MIT
