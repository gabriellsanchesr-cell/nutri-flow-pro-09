

# Redesign: Mini Landing Page + Login

## What's changing

The current page has a two-card selection (Paciente / Nutricionista) that doesn't match the intent. Instead, we'll build a single-page mini landing page that scrolls naturally into the login form -- no view toggling needed.

## Layout

```text
┌─────────────────────────────────────────────┐
│  [gradient bg + decorative blurs]           │
│                                             │
│  HERO SECTION                               │
│  ┌─────────────────────────────────────┐    │
│  │         [Logo]                      │    │
│  │    "Bem-vindos!"                    │    │
│  │    "Acesse aqui tudo sobre seu      │    │
│  │     acompanhamento nutricional..."  │    │
│  │                                     │    │
│  │  ✓ Plano alimentar personalizado    │    │
│  │  ✓ Evolução e resultados           │    │
│  │  ✓ Diário alimentar                │    │
│  │  ✓ Receitas e orientações          │    │
│  │                                     │    │
│  │  [Acessar meu portal ↓]            │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  LOGIN CARD                                 │
│  ┌─────────────────────────────────────┐    │
│  │  "Acesse seu portal"               │    │
│  │  [email]  [senha]  [Entrar]        │    │
│  │  Esqueci minha senha               │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  FOOTER CTA                                │
│  "Ainda não é paciente?"                    │
│  "Conheça meu trabalho →"                   │
│  → gabrielnutri.com.br                      │
│                                             │
└─────────────────────────────────────────────┘
```

## Changes to `src/pages/Login.tsx`

- Remove the `view` state and the two-card selection grid entirely
- Remove the "Sou Nutricionista" card completely
- Build a single scrollable page with three sections:
  1. **Hero** -- Logo, welcome text, 4 feature bullet points (with check icons), and a CTA button that smooth-scrolls to the login card
  2. **Login card** -- The existing email/password form (glassmorphism card), with "Esqueci minha senha" link
  3. **Footer CTA** -- "Ainda não é paciente?" with the external link to gabrielnutri.com.br
- Keep all existing auth logic unchanged
- Use the existing design tokens (primary blue, glassmorphism, rounded-xl, Plus Jakarta Sans)
- Feature bullets use `CheckCircle` icons from lucide-react
- Responsive: stacks vertically, max-w-md for the login card

No other files need changes.

