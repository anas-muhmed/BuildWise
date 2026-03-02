# BuildWise — Local Setup Guide

**2-minute setup. Follow exactly.**

---

## 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/buildwise.git
cd buildwise
npm install
```

---

## 2. Create your `.env` file

```bash
cp .env.example .env
```

Now open `.env` and fill in **only these two values** (the rest can stay as-is):

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/buildwise?retryWrites=true&w=majority
JWT_SECRET=any-long-random-string-here
```

> **Where to get `MONGODB_URI`:**  
> MongoDB Atlas → your cluster → **Connect** → **Drivers** → copy the connection string  
> Replace `<password>` with your Atlas password.
>
> **JWT_SECRET:** just type any random string, e.g. `mysupersecret123abc`

---

## 3. Run

```bash
npm run dev
```

Open **http://localhost:3000** → Register → Start using the app.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Register/Login fails | Check MongoDB Atlas → **Network Access** → ensure `0.0.0.0/0` is added |
| `Module not found` error | Run `npm install` again |
| Port 3000 in use | Run `npm run dev -- -p 3001` and open that port |
| `.env` file not found | Make sure you ran `cp .env.example .env` and filled in MONGODB_URI |
| App loads but AI gives generic output | Set `USE_REAL_AI=false` in `.env` (mock mode works fine for demo) |

---

## For the Demo / Exam

You don't need OpenAI for the app to work — set `USE_REAL_AI=false` and all AI features use smart mock responses. The student mode algorithms (Architecture Builder, scoring, team distribution) work **entirely without AI**.
