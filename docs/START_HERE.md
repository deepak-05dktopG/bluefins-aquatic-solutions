# Start Here (Non‑Technical Guide)

## What is this?

This project is a **website** plus a **server**.

- The **website** lives in `client/`
- The **server** lives in `server/`

You normally run **both** when testing on your computer.

## Step-by-step: run it on your computer

### A) Start the server (backend)

1. Open VS Code.
2. Open the terminal (Top menu: Terminal → New Terminal).
3. Copy/paste this:

```bash
cd server
npm install
npm run dev
```

What this means:
- `npm install` = downloads the required packages
- `npm run dev` = starts the server and keeps it running

### B) Start the website (frontend)

1. Open a **second** terminal tab.
2. Copy/paste this:

```bash
cd client
npm install
npm run dev
```

3. It will print a link like `http://localhost:5173`. Open it in your browser.

## If something goes wrong

- “Command not found: npm” → Node.js is not installed (install from https://nodejs.org/)
- “Cannot connect to database” → server needs correct settings in `server/.env`
- “Port already in use” → another program is using that port; close it or change the port in `server/.env`

## Stopping the app

To stop the running server or website, click the terminal and press `Ctrl + C`.
