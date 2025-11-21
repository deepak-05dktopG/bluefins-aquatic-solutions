# Bluefins Aquatic Solutions - Backend Server

Backend API for Bluefins Swimming Academy management system.

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

Create a `.env` file in the root directory:

```env
PORT=8000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
NODE_ENV=production
JWT_SECRET=your_secret_key
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
