

# Design Modernization & Bug Fix Plan

## Build Errors (Critical — must fix first)

Both edge functions have `error.message` on an `unknown` type. Fix by casting `error` in the catch blocks:

- `supabase/functions/manage-patient-auth/index.ts` line 176: `(error as Error).message`
- `supabase/functions/manage-team-auth/index.ts` line 167: `(error as Error).message`

## Design Improvements

### 1. Global CSS & Theme Refinements (`src/index.css`)
- Add smooth transitions globally for interactive elements
- Add subtle gradient to the login page background
- Improve card hover effects with `transition` and `shadow-md` on hover
- Add `scroll-behavior: smooth` to html

### 2. Login Page (`src/pages/Login.tsx`)
- Add a subtle gradient background (primary to accent)
- Add a glass-morphism effect to the login card (`backdrop-blur`, semi-transparent bg)
- Add entrance animation (fade-in/slide-up)
- Improve button with loading spinner icon instead of text change

### 3. Dashboard (`src/pages/Dashboard.tsx`)
- Add a welcome greeting with user name and current date
- Add gradient icon backgrounds on stat cards instead of flat `bg-accent`
- Add hover elevation effect on cards
- Add empty state illustrations for lists
- Format dates more readable (relative: "hoje", "amanhã")

### 4. Sidebar (`src/components/AppSidebar.tsx`)
- Add subtle gradient to sidebar header area
- Add user avatar/email in footer before the logout button
- Add separator between main nav and config section
- Improve active state with left border accent + subtle bg gradient

### 5. Patient List (`src/pages/Pacientes.tsx`)
- Add avatar initials circle next to patient name in table
- Improve filter buttons with pill-style design
- Add hover row highlight with subtle left border accent
- Add patient count summary text

### 6. Patient Detail Header (`src/components/paciente/PacienteHeader.tsx`)
- Add subtle gradient background to header
- Improve avatar with gradient background
- Better spacing and visual hierarchy

### 7. Patient Sidebar (`src/components/paciente/PacienteSidebar.tsx`)
- Add subtle section grouping dividers
- Improve active state animation (smooth transition)

### 8. Cards & Components (Global)
- Add `hover:shadow-md transition-shadow` to all Card components via CSS
- Improve border-radius consistency (`rounded-xl` everywhere)

### 9. Notification Center (`src/components/NotificationCenter.tsx`)
- Add dark mode compatibility for color maps (replace hardcoded bg-blue-50 etc.)

### 10. Portal do Paciente (`src/pages/PortalPaciente.tsx`)
- Improve bottom navigation bar with more modern pill-style active indicator
- Add subtle animations on tab switches

## Files to Modify
1. `supabase/functions/manage-patient-auth/index.ts` — fix TS error
2. `supabase/functions/manage-team-auth/index.ts` — fix TS error  
3. `src/index.css` — global style improvements
4. `src/pages/Login.tsx` — modernize login page
5. `src/pages/Dashboard.tsx` — improve dashboard design
6. `src/components/AppSidebar.tsx` — enhance sidebar
7. `src/pages/Pacientes.tsx` — improve patient list
8. `src/components/paciente/PacienteHeader.tsx` — modernize header
9. `src/components/paciente/PacienteSidebar.tsx` — improve nav
10. `src/components/AppLayout.tsx` — improve header bar

