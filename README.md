# QC Checking App

Real-time QC Checking Progress Monitoring System

## Tech Stack

- **Frontend & Backend**: Next.js 14 (App Router)
- **Database**: Vercel Postgres / PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Scanner**: html5-qrcode (camera + manual fallback)
- **Real-time**: Server-Sent Events (SSE)

## Features

- 📷 Scan barcode/QR code via camera HP
- ✏️ Fallback input manual
- ✅ Input data alignment, sudut, susut
- 📊 Real-time QC Progress table
- 🔢 Counter (3/4 checks per bobbin)
- 📅 History per hari
- 🔄 Real-time update ke semua client

## Getting Started

### Prerequisites

- Node.js 18+
- npm atau yarn
- PostgreSQL database (local atau Vercel Postgres)

### Installation

```bash
# Clone / masuk ke folder project
cd qc-checking-app

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Setup database URL di .env.local
# Untuk local: postgresql://user:password@localhost:5432/qc_checking
# Untuk Vercel: Paste URL dari Vercel Dashboard

# Generate Prisma client
npm run db:generate

# Push schema ke database
npm run db:push

# Start development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### Database Commands

```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema ke database
npm run db:studio      # Buka Prisma Studio (GUI)
```

## Deployment to Vercel

### Step 1: Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/qc-checking-app.git
git push -u origin main
```

### Step 2: Setup Vercel

1. Buka [vercel.com](https://vercel.com)
2. Klik "Add New Project"
3. Import repository GitHub
4. Klik "Deploy"

### Step 3: Setup Vercel Postgres

1. Di project Vercel, buka "Storage" tab
2. Klik "Create Database"
3. Pilih "Vercel Postgres"
4. Copy connection string ke environment variable (otomatis)

### Step 4: Configure Environment Variables

Di Vercel Dashboard > Settings > Environment Variables:

```
POSTGRES_URL = (otomatis dari Vercel Postgres)
```

### Step 5: Deploy

Setiap push ke branch `main` akan auto-deploy.

## Project Structure

```
qc-checking-app/
├── app/
│   ├── api/
│   │   ├── scan/route.ts      # POST: Submit scan, GET: List scans
│   │   ├── progress/route.ts  # GET: QC progress
│   │   └── sse/route.ts       # SSE: Real-time updates
│   ├── page.tsx               # Main page
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles
├── components/
│   ├── Scanner.tsx            # Camera scanner + manual input
│   ├── ManualInput.tsx        # Form input manual
│   ├── QCProgressTable.tsx    # Progress table (real-time)
│   ├── ScanStepIndicator.tsx  # Step progress indicator
│   ├── ScanHistory.tsx        # Recent scans
│   └── CounterBadge.tsx       # Bobbin counter badges
├── lib/
│   ├── prisma.ts              # Prisma client
│   ├── store.ts               # Zustand state store
│   ├── types.ts               # TypeScript types
│   └── utils.ts               # Utility functions
├── prisma/
│   └── schema.prisma           # Database schema
└── package.json
```

## API Endpoints

### POST /api/scan
Submit new scan data.

```json
{
  "nik": "1447",
  "nama": "Putri Naura",
  "machine": "431",
  "bobbinNr": "L2603046777",
  "alignment": "OK",
  "sudut": 0.5,
  "susut": 0.1,
  "remark": ""
}
```

### GET /api/scan
Get today's scans (with filters).

```
/api/scan?date=2026-01-01
/api/scan?nik=1447
/api/scan?bobbinNr=L2603046777
```

### GET /api/progress
Get QC progress grouped by machine + operator.

### GET /api/sse
Server-Sent Events for real-time updates.

## Scan Flow

1. **Scan NIK** → Scan kartu identitas operator
2. **Scan Machine** → Scan barcode mesin
3. **Scan Bobbin** → Scan nomor bobbin
4. **Input Manual** → Pilih OK/NOT OK dari papan meja, isi sudut & susut
5. **Submit** → Data tersimpan, QC Progress update otomatis

## License

MIT
