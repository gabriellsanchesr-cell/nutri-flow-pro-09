

# Polish: Modern Login Page Design

## What's changing

Elevate the current two-column login page with modern design touches: glassmorphism card for the form, subtle gradient background on the login column, refined typography hierarchy, smoother input styles, and a more polished banner overlay.

## Changes to `src/pages/Login.tsx`

1. **Banner column**: Add a stronger gradient overlay (diagonal, from primary/60 to primary/20) and overlay a subtle tagline text at the bottom-left of the banner (e.g., "Sua evolução começa aqui") with a frosted glass pill behind it
2. **Login column background**: Replace flat `bg-background` with a subtle radial gradient using CSS (light radial glow from primary/5 at center)
3. **Login card**: Wrap the form area in a glassmorphism container (`bg-white/70 dark:bg-card/70 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl p-8`)
4. **Logo**: Increase size slightly (`h-24`), add a subtle glow/shadow effect
5. **Heading**: Use a gradient text effect on "Entrar no Portal" (bg-gradient-to-r from-primary to-primary/70, bg-clip-text, text-transparent)
6. **Inputs**: Add focus transition with `transition-all duration-200`, subtle background on focus (`focus:bg-white`), and a left icon (Mail for email, Lock for password) inside each input using a wrapper div
7. **Login button**: Add a gradient background (`bg-gradient-to-r from-primary to-primary/80`), slight shadow on hover (`hover:shadow-lg hover:shadow-primary/25`), and scale effect (`hover:scale-[1.02] active:scale-[0.98] transition-all`)
8. **Separator**: Style the "ou" chip with a tiny border and rounded-full pill
9. **CTA button**: Add a hover color lift and arrow animation on hover
10. **Animation**: Add staggered fade-in with animation-delay on each section (logo, form, CTA) using inline style `animationDelay`

## Files to modify
- `src/pages/Login.tsx` only

