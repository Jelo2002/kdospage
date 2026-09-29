# 🛡️ KDOS SMP Database Management & Staff Supervision System

A modern, full-stack web application designed for Minecraft SMP communities. Built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**, pre-configured for 1-click deployment on **Vercel** and structured for **GitHub**.

---

## ✨ Key Features

### 1. 📝 Dedicated Interview Portal (`/interview`)
- Streamlined, distraction-free applicant evaluation form for voice interviews.
- **In-Game Name (IGN)** with **Live Minecraft Skin / Head Preview** as you type.
- **1 to 5 Star Rating**: Interactive star selector with rubric descriptions (1 = Reject, 5 = Instant Accept).
- **Interview Notes**: Textarea for candidate answers, experience, and observations.
- **Quick Applicant Badges**: Toggle tags like *Builder, Redstone, PvP, Good Mic, Active, Mature*.
- Fast submit button with instant form reset for back-to-back interviews.

### 2. 📊 Candidate DBMS Dashboard (`/`)
- Review all interview submissions in one place.
- **Filter & Search**: Filter by star rating (5★, 4+★, etc.), status (*Accepted, Pending, Rejected*), or search keywords in notes.
- **Inline Actions**: One-click **Accept** (green), **Pending** (amber), or **Reject** (red) buttons.
- **Candidate Modal**: Inspect complete interview transcripts, edit ratings, and adjust notes.
- **CSV Exporter**: Download all candidate records into a `.csv` spreadsheet for backups.

### 3. 🛡️ Staff Management & Department Supervision (`/staff-management`)
- Full roster tracking for staff members across departments (*Recruitment, Moderation, Development, Building, Events*).
- Status tracking: **Active**, **Hiatus**, and **LOA (Leave of Absence)** with return dates and reasons.
- **Department Deficiency Monitor**: Automatically detects if active staff falls below required minimums and flags understaffed departments with prominent **"LACKING STAFF"** alerts.

### 5. 🔐 Discord Username & Unique PIN Authentication
- **Private Access Gate**: Visitors cannot view candidate records or staff rosters upfront.
- **Discord + Unique PIN Login**:
  - Sign in with your registered **Discord username** and your **personal security PIN**.
  - **Self-Assign PIN**: First-time staff members can set their own unique 4+ digit PIN on first sign-in.
  - **Self-Registration**: New team members can register their Discord handle, Minecraft IGN, role, and PIN.
- **Persistent Device Caching**:
  - Includes a "Remember session on this device" setting (enabled by default) so you don't need to sign in every time you reopen the site!
- **Owner & Developer PIN Reset**:
  - Owners and Developers can reset any staff member's PIN in the **Staff Management** dashboard or modal, prompting the user to set a new PIN on next login.
- **One-Click Logout**: Securely terminate the cached session anytime from the top navigation bar.

---

## 🚀 How to Upload to GitHub

1. Initialize git in your local project directory:
   ```bash
   git init
   git add .
   git commit -m "feat: Initial commit for KDOS SMP DBMS & Staff System"
   ```

2. Create a new repository on [GitHub](https://github.com/new).

3. Link your remote repository and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```

---

## ☁️ How to Deploy on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **"Add New..."** → **"Project"**.
3. Select your newly pushed GitHub repository.
4. **Framework Preset**: Next.js (automatically detected).
5. Click **Deploy**.

> [!NOTE]
> The application includes an automatic in-memory fallback store pre-seeded with sample candidates and staff. It works **immediately out-of-the-box upon deployment** without crashing even before database keys are set!

---

## 🗄️ Setting Up Permanent Cloud Database (Supabase)

To persist data permanently across serverless instances on Vercel:

1. Create a free account at [Supabase](https://supabase.com) and click **New Project**.
2. Go to the **SQL Editor** tab in your Supabase dashboard.
3. Open the [`schema.sql`](./schema.sql) file from this repository, paste its contents into the SQL Editor, and click **Run**.
4. Go to **Project Settings** → **API**.
5. Copy:
   - **Project URL**
   - **Service Role Key** (or `anon` public key)
6. In your **Vercel Project Settings** → **Environment Variables**, add:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-key-here
   ```
7. Redeploy on Vercel. Your database is now live, persistent, and backed by PostgreSQL!

---

## 💻 Local Development

If you have Node.js 18+ installed on your local machine:

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Open in browser
http://localhost:3000
```

---

## 📁 Repository Structure

```
KDOS/
├── .github/workflows/build.yml # GitHub Actions CI
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout & role provider
│   │   ├── globals.css         # Tailwind styling & dark theme
│   │   ├── page.tsx            # Candidate DBMS Dashboard
│   │   ├── interview/page.tsx  # Dedicated 1-5 Star Interview Page
│   │   ├── staff/page.tsx      # Staff / Interviewer Portal
│   │   ├── staff-management/   # Staff Roster & Department Supervision
│   │   └── api/                # Next.js Serverless API endpoints
│   ├── components/
│   │   ├── Navbar.tsx          # Navigation & Role Switcher
│   │   ├── StarRating.tsx      # 1-5 Star Selector with descriptions
│   │   ├── SkinAvatar.tsx      # Live Minecraft player head preview
│   │   ├── DepartmentCard.tsx  # Lacking staff warning cards
│   │   ├── CandidateModal.tsx  # View/edit candidate interview
│   │   └── StaffModal.tsx      # Add/edit staff & LOA tracker
│   └── lib/
│       ├── types.ts            # TypeScript interfaces
│       └── db.ts               # Supabase client + fallback store
├── schema.sql                  # PostgreSQL / Supabase migration script
├── vercel.json                 # Vercel configuration
├── package.json                # Project dependencies
└── README.md                   # Documentation
```
