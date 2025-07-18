# EduTracker

EduTracker is a modern, fully responsive student productivity and attendance tracker built with Next.js. It helps students manage their classes, attendance, tasks, and schedules with a beautiful, mobile-friendly interface and customizable themes.

## Features

- 📅 **Schedule & Attendance**: Track your classes, mark attendance, and view weekly or daily schedules.
- ✅ **To-Do List**: Organize tasks by course, set priorities, and mark completion.
- 🏆 **Dashboard & Activity**: See stats, upcoming classes/tasks, and a timeline of your activity.
- 🤖 **AI Agent**: Get instant help, tips, and productivity suggestions from the built-in EduTrack AI Agent. The AI can answer questions about the app, guide you to features, and help you get the most out of EduTracker.
- 🔒 **Authentication**: Secure sign up/sign in with credentials or Google.
- ⚡ **Fast & Modern**: Built with Next.js App Router, Tailwind CSS, and best practices for performance and accessibility.
- 📱 **Fully Responsive**: Works seamlessly on all devices, from 300px mobile screens to large desktops.
- 🌓 **Theme Support**: Easily switch between light and dark themes. All UI elements use CSS variables for consistent theming.
- 🔐 **Secure by Design**: All API keys and secrets are loaded from environment variables. No secrets are ever hardcoded in the codebase.

## Getting Started

First, set up your environment variables. Create a `.env` file in the project root with the following (see `.env.example` if available):

```
MONGODB_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
GROQ_API_KEY=your_groq_api_key
```

**Never commit your `.env` file to version control.**

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## AI Agent

EduTracker features a built-in AI Agent (powered by Groq) that can:
- Answer questions about how to use the app
- Guide you to features (e.g., how to add a class or mark attendance)
- Offer productivity tips and reminders
- Help you get the most out of EduTracker

The AI Agent is accessible from a floating button on every page. All AI requests are handled securely via the backend, and the API key is never exposed to the client.

## Responsive Design

EduTracker is designed mobile-first and adapts to any screen size. All pages and components (dashboard, attendance, schedule, todo, activity, profile, auth, etc.) are fully responsive:
- Controls and cards stack vertically on small screens
- Touch targets and font sizes are optimized for mobile
- Grids and tables scroll horizontally if needed
- No horizontal overflow or squished content

## Theming

EduTracker uses a CSS variable-based theme system. You can switch between light and dark themes (and add more if desired). All colors, backgrounds, borders, and UI states are controlled by semantic tokens:

- `--bg`, `--bg-light`, `--bg-dark`: backgrounds
- `--text`, `--text-muted`: text colors
- `--primary`, `--danger`, `--success`, etc.: semantic accents
- `--btn-bg`, `--btn-text`: button colors
- ...and more (see table below)

To add or customize a theme, edit the CSS variables in `globals.css` or your theme provider.


