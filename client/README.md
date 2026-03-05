# Bluefins Aquatic Solutions - Frontend

Modern React application for Bluefins Swimming Academy management system.

## Quick start (simple)

If you only want to run the website on your computer:

```bash
cd client
npm install
npm run dev
```

Plain English: “Download what this website needs, then start it.”

For the full non‑technical guide (including starting the backend API), see `../docs/START_HERE.md`.

## Features
- Responsive design with React Bootstrap
- Contact form with EmailJS integration
- Admin panel for managing feedback, posts, and worksheets
- Image uploads with Cloudinary
- Beautiful animations with AOS
- Posts carousel with auto-scroll
- Team resource sharing system

## Tech Stack
- **Framework:** React 18.2.0
- **Build Tool:** Vite
- **Routing:** React Router DOM 6.18.0
- **UI:** React Bootstrap, React Icons
- **Styling:** CSS, Sass, Bootstrap
- **Animations:** AOS, Framer Motion, React Spring
- **Notifications:** SweetAlert2
- **Email:** EmailJS
- **Image Upload:** Cloudinary

## Environment Variables

Create `.env.production` file:

```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

## Installation

```bash
npm install
```

## Running Locally

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Deploy to Netlify (Recommended)

1. **Via GitHub:**
   - Go to https://netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub repository
   - Build settings:
     - **Base directory:** `client`
     - **Build command:** `npm run build`
     - **Publish directory:** `client/dist`
   - Add environment variables in Netlify dashboard
   - Deploy

2. **Via Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   cd client
   netlify deploy --prod
   ```

### Deploy to Vercel

1. **Via GitHub:**
   - Go to https://vercel.com
   - Import repository
   - Root directory: `client`
   - Framework preset: Vite
   - Add environment variables
   - Deploy

2. **Via Vercel CLI:**
   ```bash
   npm i -g vercel
   cd client
   vercel --prod
   ```

### Deploy to Render

1. Go to https://render.com
2. New → Static Site
3. Connect repository
4. Settings:
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
5. Add environment variables
6. Deploy

## Environment Variables for Production

Set these in your hosting platform:

```
VITE_API_BASE_URL = https://bluefins-backend.onrender.com/api
VITE_CLOUDINARY_CLOUD_NAME = dgjuyk7cb
VITE_CLOUDINARY_UPLOAD_PRESET = bluefins_images
```

## Project Structure

```
client/
├── public/
│   ├── assets/
│   │   ├── Logo.png
│   │   └── lessonPlan/
│   └── _redirects
├── src/
│   ├── api/
│   ├── components/
│   │   ├── adminPanel/
│   │   ├── Card.jsx
│   │   ├── Footer.jsx
│   │   ├── Navbar.jsx
│   │   └── ProgramCard.jsx
│   ├── hooks/
│   ├── pages/
│   │   ├── AdminPanel/
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   ├── Home.jsx
│   │   └── ...
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
├── .env.production
├── .env.development
├── netlify.toml
├── vercel.json
├── package.json
└── vite.config.js
```

## Admin Access

- Navigate to `/admin`
- Triple-click on logo in navbar
- Login with credentials
- Access admin panel features

## Author
Deepak Digital Craft

## License
MIT
