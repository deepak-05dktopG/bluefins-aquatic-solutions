# Commands (Simple English)

These are copy/paste commands you can run in the VS Code terminal.

## Start the project (most common)

### Start the backend server (API)

```bash
cd server
npm install
npm run dev
```

Meaning: “Download server packages, then start the server.”

### Start the frontend website (UI)

```bash
cd client
npm install
npm run dev
```

Meaning: “Download website packages, then start the website.”

## Stop running

- In the terminal window that is running, press `Ctrl + C`.

## Build for hosting

### Build the website

```bash
cd client
npm run build
```

Meaning: “Create the `dist/` folder that hosting platforms upload.”

### Preview the built website (optional)

```bash
cd client
npm run preview
```

Meaning: “Run the built website locally to double-check.”

## Check code quality (optional)

### Lint (frontend)

```bash
cd client
npm run lint
```

### Lint (backend)

```bash
cd server
npm run lint
```

## Admin accounts (owner / developer)

### Create or update an admin account (recommended)

```bash
cd server
npm run create-admin -- --id "owner" --role superadmin
```

Meaning: “Create an admin login.”

If you want to set a password directly (not recommended because it stays in terminal history):

```bash
cd server
npm run create-admin -- --id "owner" --password "MyPass123" --role superadmin
```

## Seed membership plans (developer)

### Seed the official plans (poster plans)

```bash
cd server
npm run seed-poster-plans
```

Meaning: “Put the standard membership plans into the database.”

### Seed the test plan (₹1) — testing only

```bash
cd server
npm run seed-test-plan
```

Meaning: “Create a small test plan for payment testing.”

## Common setup files (not commands)

- `server/.env` controls secrets/keys/database settings (copy from `server/.env.example`).
- Frontend environment variables are set in hosting dashboard, or `client/.env.*` when running locally.
