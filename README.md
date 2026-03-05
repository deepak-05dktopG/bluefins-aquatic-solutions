# Blue Fins Project (Client + Server)

This project has **two parts**:

- **client/** = the website you see in the browser (frontend)
- **server/** = the API + database logic (backend)

## Quick start (simple, copy/paste)

### 1) Install the tools (one-time)

- Install **Node.js (LTS)** from https://nodejs.org/
- Restart VS Code after installing Node.js

### 2) Start the backend server (API)

Open a terminal in VS Code and run:

```bash
cd server
npm install
npm run dev
```

Plain English: “Install server dependencies, then start the server in developer mode.”

### 3) Start the frontend website (in a second terminal)

Open a **new** terminal tab and run:

```bash
cd client
npm install
npm run dev
```

Plain English: “Install website dependencies, then start the website.”

When it starts, VS Code will show a local URL (usually `http://localhost:5173`). Open that in your browser.

## Most common commands (human-friendly)

- **Start website (frontend):**
  - `cd client` then `npm run dev`
- **Start server (backend):**
  - `cd server` then `npm run dev`
- **Build website for hosting:**
  - `cd client` then `npm run build`
- **Run server in production mode:**
  - `cd server` then `npm start`

## Admin setup (developer / owner)

Create an admin user (server must have DB configured):

```bash
cd server
npm run create-admin -- --id "owner" --role superadmin
```

Plain English: “Create a login account for the admin panel.”

## More help

- Simple docs: see [docs/START_HERE.md](docs/START_HERE.md)
- Simple command list: see [docs/COMMANDS.md](docs/COMMANDS.md)
- What each folder/file means: see [docs/PROJECT_MAP.md](docs/PROJECT_MAP.md)
- Frontend details: see [client/README.md](client/README.md)
- Backend details: see [server/README.md](server/README.md)
