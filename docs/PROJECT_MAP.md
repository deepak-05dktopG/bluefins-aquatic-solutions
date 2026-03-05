# Project Map (What each folder/file is)

## Top level

- `client/` = the browser website (React + Vite)
- `server/` = the backend API (Node.js + Express + MongoDB)
- `docs/` = simple documentation for humans

## client/

Common files:

- `client/package.json` = list of frontend packages + the commands you can run (`npm run dev`, etc.)
- `client/vite.config.js` = Vite build/dev configuration
- `client/netlify.toml` = Netlify deployment settings
- `client/vercel.json` = Vercel deployment settings
- `client/public/` = public files (images, robots.txt, sitemap.xml)
- `client/src/` = the actual React source code

Inside `client/src/`:

- `App.jsx` = main app component (pages are wired here)
- `main.jsx` = the first file that starts the React app
- `pages/` = full pages/screens (Home, About, Admin pages, etc.)
- `components/` = reusable UI pieces (Navbar, Footer, etc.)
- `api/` = functions that talk to the backend server
- `hooks/` = reusable React hooks
- `utils/` = small helper functions
- `styles/` = CSS

## server/

Common files:

- `server/package.json` = list of backend packages + commands (`npm run dev`, seeding, etc.)
- `server/.env.example` = sample environment settings (copy to `.env`)
- `server/src/server.js` = starts the Express API server

Inside `server/src/`:

- `routes/` = “which URL goes to which controller”
- `controllers/` = request handlers (what happens when an API URL is called)
- `models/` = database shapes (MongoDB / Mongoose schemas)
- `middleware/` = security checks (admin auth, admin key)
- `config/` = database connection and environment loading
- `scripts/` = one-time commands you run manually (create admin, seed plans)
- `utils/` = helper code (for example email sending)

Other:

- `server/services/whatsappReminder.js` = WhatsApp reminder logic (used by a scheduled job)
