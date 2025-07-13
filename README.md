# EduTracker

EduTracker is a modern, fully responsive student productivity and attendance tracker built with Next.js. It helps students manage their classes, attendance, tasks, and schedules with a beautiful, mobile-friendly interface and customizable themes.

## Features


- 📅 **Schedule & Attendance**: Track your classes, mark attendance, and view weekly or daily schedules.
- ✅ **To-Do List**: Organize tasks by course, set priorities, and mark completion.
- 🏆 **Dashboard & Activity**: See stats, upcoming classes/tasks, and a timeline of your activity.
- 🔒 **Authentication**: Secure sign up/sign in with credentials or Google.
- ⚡ **Fast & Modern**: Built with Next.js App Router, Tailwind CSS, and best practices for performance and accessibility.
- 📱 **Fully Responsive**: Works seamlessly on all devices, from 300px mobile screens to large desktops.
- 🌓 **Theme Support**: Easily switch between light and dark themes. All UI elements use CSS variables for consistent theming.

## Getting Started

First, run the development server:

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

## Color Tokens Reference

| Variable Name         | Purpose      |
| --------------------- | ------------ |
| `--bg-dark`           | layout       |
| `--bg`                | base         |
| `--bg-light`          | surface      |
| `--overlay`           | overlay      |
| `--text`              | text         |
| `--text-muted`        | hint         |
| `--highlight`         | highlight    |
| `--link`              | link         |
| `--link-hover`        | link-hover   |
| `--border`            | border       |
| `--border-muted`      | divider      |
| `--focus-ring`        | focus        |
| `--primary`           | accent       |
| `--secondary`         | secondary    |
| `--danger`            | danger       |
| `--warning`           | warning      |
| `--success`           | success      |
| `--info`              | info         |
| `--input-bg`          | input        |
| `--input-border`      | input-border |
| `--input-placeholder` | placeholder  |
| `--shadow`            | shadow       |
| `--shadow-elevated`   | shadow-high  |
| `--code-bg`           | code         |
| `--code-text`         | code-text    |
| `--code-comment`      | comment      |
| `--code-keyword`      | keyword      |
| `--code-function`     | function     |
| `--btn-bg`            | btn          |
| `--btn-text`          | btn-text     |
| `--btn-hover-bg`      | btn-hover    |
| `--btn-hover-text`    | btn-hover-tx |



