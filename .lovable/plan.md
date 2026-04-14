

# Redesign: Login Page (WebDiet-style two-column layout)

## What's changing

Replace the current single-column mini landing page with a **two-column layout** inspired by the WebDiet screenshot: a large banner area on the left and a clean login form on the right.

## Layout

```text
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ┌──────────────────────┐  ┌────────────────────────────┐  │
│  │                      │  │                            │  │
│  │   BANNER / IMAGE     │  │        [Logo]              │  │
│  │                      │  │                            │  │
│  │   (placeholder or    │  │   ENTRAR NO PORTAL         │  │
│  │    uploaded image)    │  │                            │  │
│  │                      │  │   [email input]            │  │
│  │   Full height,       │  │   [password input]         │  │
│  │   rounded corners,   │  │   [Entrar button]          │  │
│  │   covers ~55% width  │  │                            │  │
│  │                      │  │   Esqueceu a senha?        │  │
│  │                      │  │                            │  │
│  │                      │  │   ─────────────────────    │  │
│  │                      │  │                            │  │
│  │                      │  │   [Conheça meu trabalho]   │  │
│  │                      │  │   → gabrielnutri.com.br    │  │
│  │                      │  │                            │  │
│  └──────────────────────┘  └────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘

Mobile: banner hidden, login form full-width centered
```

## Changes to `src/pages/Login.tsx`

- Replace the current scrollable single-column layout with a **side-by-side** layout (`grid grid-cols-1 lg:grid-cols-2`)
- **Left column**: A banner area with a placeholder image (`/banner-login.png`) that fills the column, with rounded corners and object-cover. The user can later replace this image
- **Right column**: Centered login card containing:
  - Logo at top
  - "ENTRAR NO PORTAL" heading
  - Email + password inputs
  - "Entrar" primary button
  - "Esqueceu a senha?" link
  - Separator line
  - "Conheça meu trabalho" button/link (styled like WebDiet's secondary purple button) linking to gabrielnutri.com.br
- Remove the hero section, feature bullets, scroll behavior, and ArrowDown icon
- On mobile (`< lg`), hide the banner and show only the login form centered
- Keep all existing auth logic unchanged

## Files to modify
1. `src/pages/Login.tsx` — full rewrite of the layout
2. `public/banner-login.png` — copy a placeholder gradient image or create a styled placeholder div so the user can replace it later

