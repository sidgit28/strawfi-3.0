# Finx 2.0 — Frontend

This is the frontend for the Finx 2.0 (Fintech Multiverse) prototype, an investment 
and stock tracking tool. Built with [Next.js](https://nextjs.org), TypeScript, and 
Tailwind CSS — bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Tech Stack

- **Framework:** Next.js
- **Language:** TypeScript
- **Styling:** Tailwind CSS

## Getting Started

### Prerequisites
- Node.js (v18 or later recommended)
- npm

### Installation
```bash
cd Frontend
npm install
```

### Running locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx` — the page auto-updates as 
you edit the file. This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) 
to automatically optimize and load [Geist](https://vercel.com/font), a font family from Vercel.

### Build for production
```bash
npm run build
npm start
```

## Connecting to the Backend
This frontend calls the API routes defined in `Backend/api/` to fetch persona data 
and handle persona selection. See the [Backend README](../Backend/README.md) for 
endpoint details.

## Learn More

To learn more about Next.js, take a look at these resources:

- [Next.js Documentation](https://nextjs.org/docs) — learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) — an interactive Next.js tutorial
- [Next.js GitHub repository](https://github.com/vercel/next.js) — feedback and contributions welcome

## Deploy

The easiest way to deploy this app is via the [Vercel Platform](https://vercel.com/new), 
from the creators of Next.js. See the [deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) 
for details.

## Folder Structure

```
Frontend/
├── components/    # Reusable UI components
├── hooks/         # Custom React hooks
├── public/        # Static assets (images, icons, etc.)
├── src/           # Application source code
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```
