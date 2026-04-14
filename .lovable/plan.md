

# Landing Page with Role-Based Login

## What we're building
A landing/welcome page at `/login` that presents two login options side by side (like WebDiet's portal selection style):
- **Sou Paciente** — opens the patient login form
- **Sou Nutricionista** — disabled/locked, with a tooltip or note saying "Acesso interno"

The patient login card includes a CTA at the bottom: "Ainda não é paciente? Conheça meu trabalho" linking to https://www.gabrielnutri.com.br/

## Layout
```text
┌──────────────────────────────────────────────┐
│              [Logo]                          │
│     Gabriel Sanches - Nutrição               │
│         Individualizada                      │
│                                              │
│   ┌─────────────┐   ┌─────────────┐         │
│   │  🍎 Sou     │   │  🔒 Sou     │         │
│   │  Paciente   │   │ Nutricionista│         │
│   │  [Entrar]   │   │  [Bloqueado]│         │
│   └─────────────┘   └─────────────┘         │
│                                              │
│  --- OR when patient card is selected ---    │
│                                              │
│   ┌────────────────────────────┐             │
│   │  Login do Paciente         │             │
│   │  [email]  [senha]  [Entrar]│             │
│   │  Esqueci minha senha       │             │
│   │                            │             │
│   │  Ainda não é paciente?     │             │
│   │  Conheça meu trabalho →    │             │
│   └────────────────────────────┘             │
└──────────────────────────────────────────────┘
```

## Files to modify

### 1. `src/pages/Login.tsx`
- Redesign to show two cards initially: "Sou Paciente" and "Sou Nutricionista"
- Clicking "Sou Paciente" transitions (animated) to the login form
- "Sou Nutricionista" card is visually disabled with a lock icon and "Acesso interno" label
- Add a back button from the login form to return to card selection
- Add CTA section below login form: "Ainda não é paciente?" with link to gabrielnutri.com.br
- Keep existing login logic, glassmorphism style, and gradient background

### 2. `src/App.tsx`
- No routing changes needed — `/login` already exists and `PublicRoute` handles redirects correctly

## Design details
- Uses existing design system: Plus Jakarta Sans, glassmorphism, rounded-xl, gradient background
- Two selection cards with hover elevation effect
- Smooth transition between selection view and login form (animate-fade-in)
- Disabled nutricionista card: reduced opacity, cursor-not-allowed, lock icon
- External link opens in new tab with `rel="noopener noreferrer"`

