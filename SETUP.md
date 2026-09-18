# Personal Finance Tracker - Firebase Setup

A personal finance app hosted on GitHub Pages with **Firebase Firestore** for real-time data storage.

## Quick Start (5 minutes)

### 1. Deploy to GitHub Pages

1. Create a new public repo called `finance-tracker`
2. Upload these 3 files:
   - `index-firebase.html` (rename to `index.html`)
   - `app-firebase.js` (rename to `app.js`)
   - `SETUP-FIREBASE.md` (this file)

3. Enable GitHub Pages:
   - Settings → Pages
   - Source: `Deploy from a branch` → `main` branch
   - Your app will be live at: `https://<username>.github.io/finance-tracker/`

### 2. Firebase is Already Configured

✅ The app already has your Firebase config:
- Project: `finance-tracker-68b8c`
- Firestore Database: Enabled and ready

### 3. First Time Using the App

1. Open your live app: `https://<username>.github.io/finance-tracker/`
2. Click **"Sign In"** button (top right)
3. App will sign you in anonymously to Firebase
4. You'll see **"Synced"** indicator turn green
5. All your data now syncs to Firebase in real-time!

### 4. Upload Bank Statements

1. Click **"Upload"** tab
2. Select your CSV/Excel statement
3. Enter account name (e.g., "CBA Everyday")
4. Click **"Process & save to Firebase"**
5. Data is instantly saved to Firestore

### 5. Add Holdings

- **Shares & ETFs:** Add VAS, VGS, individual stocks
- **Properties:** Record your real estate
- **Superannuation:** Track SMSF, industry funds
- **Cash:** Savings accounts, term deposits

All data syncs to Firebase automatically.

---

## How It Works

### Data Storage

```
Your App (GitHub Pages)
    ↓
Firebase Authentication (Anonymous login)
    ↓
Firestore Database (Real-time sync)
    ↓
Your Browser (Offline backup in localStorage)
```

**Three layers of safety:**
1. **Firestore** — Live, cloud-backed data
2. **Browser localStorage** — Offline access, device-level backup
3. **Real-time sync** — Changes sync instantly across devices

### Your Data in Firebase

Location: `Firestore > Collection: users > Document: {your-user-id}`

```
users/
└── {anonymous-user-id}/
    ├── transactions: [...]
    ├── holdings: { shares: [], properties: [], super: [], cash: [] }
    ├── budgets: { ... }
    ├── rules: [ ... ]
    └── lastUpdated: timestamp
```

---

## Features

### 📊 Banking & Transactions
- Import CSV/Excel statements
- Auto-categorise with rules
- Multi-account tracking
- Monthly spending breakdown

### 💼 Portfolio Management
- Shares & ETFs (cost basis, gains/losses)
- Properties (equity, rental income)
- Superannuation (SMSF, industry funds)
- Cash accounts (savings, fixed income)

### 💰 Net Worth Dashboard
- Total net worth calculation
- Asset allocation breakdown
- Rental yield tracking
- Investment performance

### 📋 Budgeting
- Monthly budgets by category
- Real-time tracking vs. budget
- Visual progress indicators

---

## Offline Access

✅ App works **offline**:
- Browser stores local copy in localStorage
- When online, syncs to Firebase
- No data loss if you're offline

⚠️ **Note:** If you use multiple devices:
- Device A saves to Firebase
- Device B pulls latest from Firebase
- Both stay in sync automatically

---

## Security & Privacy

✅ **What's secure:**
- Data stored in **private Firestore database** (only you can access)
- Anonymous Firebase authentication (no password needed)
- HTTPS encryption for all data in transit
- Firebase's enterprise-grade security

✅ **You control:**
- What data you add
- When you sign in/out
- Deleting holdings/transactions anytime

---

## Managing Your Data

### View Data in Firebase

1. Go to: https://console.firebase.google.com/u/0/project/finance-tracker-68b8c
2. Click **"Firestore Database"**
3. You'll see your user document with all data

### Export Your Data

Your data is portable:
1. Go to Firestore, select your user document
2. Copy the JSON
3. Or export CSV from the app dashboard (future feature)

### Delete Data

From the app:
- Click any transaction/holding → Remove button → saved to Firebase

From Firestore:
1. Console → Firestore → Select your document → Delete

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "App won't load" | Check GitHub Pages is enabled (Settings > Pages) |
| "Sign In fails" | Firebase SDK may not have loaded. Refresh page. |
| "Synced indicator red" | Check internet connection. App works offline too. |
| "Data not syncing" | Check browser console (F12) for errors |
| "Can't see Firestore data" | Go to https://console.firebase.google.com, check project |

### Check Browser Console

Press `F12` → Console tab → Look for errors

If you see `firebase is not defined`:
- Wait 10 seconds for Firebase SDK to load
- Refresh page

---

## Advanced: Local Development

```bash
# Clone your repo
git clone https://github.com/<username>/finance-tracker.git
cd finance-tracker

# Run local server (Python 3)
python -m http.server 8000

# Or Node.js
npx http-server

# Open http://localhost:8000
```

Your local version will sync to the same Firebase database as your live app.

---

## Firebase Project Details

- **Project ID:** `finance-tracker-68b8c`
- **Region:** US (default)
- **Database:** Firestore (NoSQL)
- **Authentication:** Anonymous
- **Storage:** Firestore Collections

You can monitor usage at: https://console.firebase.google.com/u/0/project/finance-tracker-68b8c

---

## Roadmap

- [ ] Google Sign-In (instead of anonymous)
- [ ] Multi-device sync enhancements
- [ ] Tax reporting (capital gains, rental income)
- [ ] SMSF compliance checker
- [ ] Dark mode
- [ ] Mobile app
- [ ] CSV export
- [ ] Plaid bank API integration

---

## Support

For Firebase issues:
- Firebase Docs: https://firebase.google.com/docs/firestore
- GitHub Pages Docs: https://docs.github.com/en/pages

---

**Created:** 2026
**Last Updated:** 2026-09-15
**License:** MIT
