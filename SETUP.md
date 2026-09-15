# Personal Finance Tracker - Setup & Deployment

A hosted personal finance app on GitHub Pages with GitHub-backed statement storage.

## Quick Start

### 1. Fork & Deploy to GitHub Pages

1. **Create a new GitHub repository** called `finance-tracker` (public)
2. **Upload these files:**
   - `index.html`
   - `app.js`
   - `SETUP.md` (this file)

3. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Set source to `main` branch
   - Your app will be live at `https://<your-username>.github.io/finance-tracker/`

### 2. Set Up GitHub Authentication

The app uses GitHub to store bank statements securely in a private repo.

#### Option A: Use Personal Access Token (Recommended for now)

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scope: `repo` (full control of private repositories)
4. Copy the token
5. When you first click "Connect GitHub" in the app, paste your token

#### Option B: Set Up OAuth App (For production)

1. Go to https://github.com/settings/developers
2. Click "New GitHub App"
3. Fill in:
   - **App name:** Finance Tracker
   - **Homepage URL:** `https://<your-username>.github.io/finance-tracker/`
   - **Callback URL:** `https://<your-username>.github.io/finance-tracker/`
   - **Permissions:** 
     - Repository contents: Read & Write
     - Metadata: Read-only
4. Copy the **Client ID**
5. In `app.js`, update line 4:
   ```javascript
   const GITHUB_CLIENT_ID = 'YOUR_CLIENT_ID_HERE';
   ```

### 3. How It Works

**Bank Statement Upload Flow:**
1. Click "Upload" tab
2. Select CSV/Excel bank statement from your institution
3. Enter account name (e.g., "CBA Everyday", "Amex")
4. Click "Process & save to GitHub"
5. Statements are saved to private `finance-statements` repo with path:
   ```
   statements/{AccountName}/{YYYY-MM-DD}_{filename}
   ```

**Data Storage:**
- **Local:** All data stored in browser localStorage (private, offline access)
- **GitHub:** Bank statements stored in private repo for audit trail & backup
- **Syncing:** Manual - you control what gets uploaded

### 4. File Structure After Setup

```
Your GitHub Account
├── finance-tracker (public)
│   ├── index.html
│   ├── app.js
│   └── SETUP.md
└── finance-statements (private, auto-created)
    └── statements/
        ├── CBA Everyday/
        │   ├── 2026-09-01_statement.csv
        │   └── 2026-09-05_statement.csv
        └── Amex/
            └── 2026-09-10_statement.csv
```

## CSV Format Requirements

Your bank statement CSV must have these columns (any order):

```
Date,Merchant,Amount
2026-09-01,Woolworths,125.45
2026-09-05,Salary,5000.00
2026-09-10,Electricity,180.00
```

**Supported formats:**
- CSV (comma-separated)
- Excel (.xlsx, .xls)
- Exported from: CBA, Westpac, ANZ, NAB, ING, Macquarie, etc.

## Features

### Banking & Transactions
- Import statements from multiple accounts
- Auto-categorise transactions with rules
- Search & filter transactions
- Monthly spending breakdown by category

### Portfolio Management
- Track shares & ETFs (VAS, VGS, etc.)
- Record properties (dual-occupancy, rentals)
- Monitor superannuation (industry & SMSF)
- Cash & savings accounts
- Unrealised gains/losses on investments

### Budgeting
- Set monthly budgets by category
- Real-time tracking vs. budget
- Visual progress indicators

### Analytics
- Net worth calculation
- Asset allocation breakdown
- Rental income tracking
- Property equity monitoring
- Investment performance dashboard

## Security & Privacy

✅ **What's secure:**
- Bank statements stored in **private GitHub repo** only you can access
- All data encrypted in GitHub (using HTTPS)
- Statements versioned with audit trail (who uploaded what, when)
- Browser data stored locally in your device only

✅ **What you control:**
- Only YOU decide which statements to upload
- Personal Access Token stored locally in browser
- You can revoke token anytime at https://github.com/settings/tokens

⚠️ **Best practices:**
- Use GitHub's Private repositories for statement repo
- Rotate Personal Access Token quarterly
- Don't share your GitHub token or repo link
- Review uploaded files in repo regularly

## Common Tasks

### View Uploaded Statements
1. Go to GitHub: `github.com/<your-username>/finance-statements`
2. Navigate to `statements/` folder to see all uploads
3. Each file is timestamped: `2026-09-01_statement.csv`

### Download Statements from GitHub
```bash
git clone https://github.com/<your-username>/finance-statements.git
cd finance-statements
ls statements/
```

### Re-upload an Old Statement
1. Open the Finance Tracker
2. In Upload tab, select the same file again
3. It will create a new timestamped entry
4. Transactions are deduplicated automatically (same merchant + date)

### Export All Data
**Transactions:** View all transactions, copy the table
**Holdings:** Manually record or export to Excel
**Note:** Statements on GitHub are your permanent record

### Change Account Name
1. In `finance-statements` repo, rename folder: `statements/OldName` → `statements/NewName`
2. In app, re-upload with new name
3. Old data in browser localStorage still exists (manually clear if needed)

## Troubleshooting

### "Failed to authenticate with GitHub"
- Check your Personal Access Token is valid
- Go to https://github.com/settings/tokens, verify token scope includes `repo`
- Regenerate token if expired

### "statements repo not found"
- App auto-creates it on first use
- Wait 10 seconds, refresh page
- Or manually create private repo named `finance-statements`

### "File upload failed"
- Check token permissions (must have `repo` scope)
- File size must be < 1MB
- CSV must follow format above

### "Data disappeared after refresh"
- Browser localStorage is separate per domain
- Private browsing/Incognito clears data on exit
- Check browser storage isn't full (Settings > Privacy > Clear browsing data)

## Advanced: Local Development

If you want to modify the app:

```bash
# Clone your repo
git clone https://github.com/<your-username>/finance-tracker.git
cd finance-tracker

# Run local server (Python 3)
python -m http.server 8000

# Or Node.js
npx http-server

# Open http://localhost:8000
```

## Roadmap (Future Features)

- [ ] Automatic bank API sync (Plaid integration)
- [ ] Multi-user access with permission levels
- [ ] Tax reporting (capital gains, rental income)
- [ ] Mortgage amortisation tracking
- [ ] SMSF compliance checker
- [ ] Dark mode
- [ ] Mobile app (React Native)

## Support

For issues:
1. Check this SETUP.md
2. GitHub personal access token help: https://github.com/settings/tokens
3. GitHub Pages help: https://docs.github.com/en/pages

---

**Created:** 2026
**License:** MIT (use freely, modify as you like)
