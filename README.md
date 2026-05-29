# Employee_Buddy

Full-stack app: React + Node.js + PostgreSQL (Supabase) + Gmail OAuth2 emailing.
Built to run 100% in GitHub Codespaces — nothing installs on your laptop.

---

## STEP 1 — Open in GitHub Codespaces

1. Go to https://github.com and create a new repository (call it `ems-project`)
2. Upload all these project files into it (drag & drop works)
3. Click the green **Code** button → **Codespaces** tab → **Create codespace on main**
4. Wait ~60 seconds — a full VS Code opens in your browser
5. You now have Node.js, npm, git — everything — already installed

---

## STEP 2 — Set up Supabase (your free cloud database)

No download. Takes 3 minutes.

1. Go to https://supabase.com → Sign up free
2. Click **New Project** → give it a name like `ems-db` → set a strong password → pick any region
3. Wait ~2 minutes for the project to spin up
4. Go to **Settings** (gear icon) → **Database** → scroll to **Connection string** → pick **URI**
5. Copy that URI — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the password you set in step 2
7. Save this string — you'll need it in Step 4

---

## STEP 3 — Set up Google OAuth (for login + Gmail emailing)

### Part A — Google Login (OAuth2)
1. Go to https://console.cloud.google.com
2. Create a new project → name it `EMS Project`
3. Go to **APIs & Services** → **OAuth consent screen** → External → fill in app name
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Authorized redirect URIs: add `http://localhost:5000/api/auth/google/callback`
7. Click Create → copy the **Client ID** and **Client Secret**

### Part B — Gmail API (for sending emails)
1. In the same Google Cloud project → **APIs & Services** → **Library**
2. Search **Gmail API** → Enable it
3. The same OAuth credentials above work for Gmail too

---

## STEP 4 — Create environment files

In Codespaces terminal, run:
```bash
cp server/.env.example server/.env
```

Then open `server/.env` and fill in your values:

```env
DATABASE_URL=postgresql://postgres:yourpassword@db.xxxx.supabase.co:5432/postgres
JWT_SECRET=any_long_random_string_you_make_up_like_abc123xyz789
JWT_REFRESH_SECRET=another_long_random_string_different_from_above
GOOGLE_CLIENT_ID=your_google_client_id_from_step_3
GOOGLE_CLIENT_SECRET=your_google_client_secret_from_step_3
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
GMAIL_USER=your_gmail_address@gmail.com
CLIENT_URL=http://localhost:5173
NODE_ENV=development
PORT=5000
```

---

## STEP 5 — Install dependencies

In the Codespaces terminal:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

## STEP 6 — Push database schema to Supabase

```bash
cd server
npx prisma db push
```

This reads `prisma/schema.prisma` and creates all the tables in your Supabase database automatically. You'll see output like "Your database is now in sync with your Prisma schema."

Then seed an admin user:
```bash
node seed.js
```

This creates:
- Admin login: `admin@ems.com` / `admin123`

---

## STEP 7 — Run the app

Open two terminals in Codespaces (click the + icon in the terminal panel):

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Codespaces will show a popup: "Port 5173 is available" → click **Open in Browser**

---

## STEP 8 — Access the app

- Frontend: Codespaces will give you a URL like `https://xxxx-5173.app.github.dev`
- Login with: `admin@ems.com` / `admin123`
- Or use Google Login button

> **Note:** When using Codespaces URL (not localhost), update `GOOGLE_CALLBACK_URL` and `CLIENT_URL` in your `.env` to match the Codespaces URLs.

---

## Project Structure

```
ems/
├── server/
│   ├── routes/          → API route definitions
│   ├── controllers/     → Business logic
│   ├── middleware/      → Auth + role checks
│   ├── config/          → Passport, database config
│   ├── prisma/
│   │   └── schema.prisma → Database schema (all tables)
│   ├── seed.js          → Creates initial admin user
│   ├── index.js         → Main server entry point
│   ├── .env.example     → Copy this to .env and fill values
│   └── package.json
└── client/
    ├── src/
    │   ├── pages/       → Login, Dashboard, Employees, Email
    │   ├── components/  → Navbar, EmployeeTable, Modal, Forms
    │   ├── context/     → AuthContext (global user state)
    │   └── api/         → axios instance + all API call functions
    ├── index.html
    └── package.json
```

---

## Roles & Permissions

| Role     | Can do                                              |
|----------|-----------------------------------------------------|
| ADMIN    | Everything — full access                            |
| HR       | View/edit employees, send emails, manage leave      |
| MANAGER  | View their team, approve/reject leave               |
| EMPLOYEE | View own profile, apply for leave                   |

---

## API Endpoints

| Method | Endpoint                    | Description              | Auth Required |
|--------|-----------------------------|--------------------------|---------------|
| POST   | /api/auth/register          | Register new user        | No            |
| POST   | /api/auth/login             | Login with email+pass    | No            |
| GET    | /api/auth/google            | Google OAuth login       | No            |
| GET    | /api/auth/me                | Get current user         | Yes           |
| GET    | /api/employees              | List all employees       | ADMIN/HR      |
| POST   | /api/employees              | Add new employee         | ADMIN/HR      |
| PUT    | /api/employees/:id          | Update employee          | ADMIN/HR      |
| DELETE | /api/employees/:id          | Delete employee          | ADMIN         |
| POST   | /api/email/send             | Send email via Gmail     | ADMIN/HR      |
| GET    | /api/leave                  | List leave requests      | Yes           |
| POST   | /api/leave                  | Apply for leave          | Yes           |
| PATCH  | /api/leave/:id/status       | Approve/reject leave     | ADMIN/HR/MGR  |

---

## What to add to make it more professional

- [ ] Real-time notifications with Socket.io
- [ ] Profile photo upload (Cloudinary free tier)
- [ ] Export to PDF / Excel (use `pdfkit` and `exceljs`)
- [ ] Audit log (track every action in a DB table)
- [ ] Forgot password via email
- [ ] Employee onboarding checklist
- [ ] Payroll module (generate pay slips as PDF)
- [ ] Dark mode toggle

---

## Common Issues

**"Cannot connect to database"** → Check your `DATABASE_URL` in `.env`, make sure you replaced `[YOUR-PASSWORD]`

**"Google OAuth not working"** → Make sure the redirect URI in Google Console exactly matches your `.env` value

**"Gmail send failing"** → You need to complete the Gmail OAuth2 token flow once. See `server/config/gmail.js` comments.

**Port already in use** → Run `pkill node` in terminal then start again
