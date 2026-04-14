

# Redesign: Premium Login Page

## Problems found
- Logo image not rendering (likely missing `/logo.png`)
- Banner image not showing (just gradient overlay on nothing)
- Form content overflows/gets cut off at 638px viewport height
- Colors too washed out -- everything blends into white
- Card is too tall and not scrollable

## Design approach

A clean, premium two-column login inspired by modern SaaS portals. Instead of relying on a photo banner (which may not load), the left column will use a **styled gradient background with decorative elements** as fallback, while still attempting to show the banner image if available.

## Changes to `src/pages/Login.tsx`

### Left column (banner)
- Use a rich **primary-to-dark gradient** as the base background (always looks good even without image)
- Layer the banner image on top with `object-cover` (graceful degradation if missing)
- Add **decorative floating circles/blobs** using CSS (absolute positioned divs with blur) for visual depth
- Keep the tagline pill at the bottom
- Add the logo in white on the banner side as well (or a text-based fallback)

### Right column (login)
- Remove the glassmorphism card wrapper -- go for a **clean white column** with the form directly centered
- Fix the logo: use `object-contain` (not just height) and add `max-w-[180px]` to prevent stretching
- Make the form area use `overflow-y-auto` with proper padding so it never gets cut off
- Increase contrast: darker labels, stronger input borders on focus
- The "ou" separator and CTA stay but with better spacing
- Use `min-h-screen` on the column itself for proper vertical centering

### Responsive
- On mobile: full-screen white login form, no banner
- The form area should fit comfortably in `min-h-screen` without overflow issues

### Logo fix
- Add `object-contain` to the logo `img` tag
- Cap width with `max-w-[160px]` so it doesn't stretch

## File changes
- `src/pages/Login.tsx` -- full rewrite of the layout

