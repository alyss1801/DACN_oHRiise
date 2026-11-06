# oHRiise

An interactive HRM prototype for Vietnamese enterprises, built around role-aware access, employee self-service, and approval workflows.

**Stack:** Next.js App Router · React · TypeScript · Tailwind CSS · Motion

## Scope

- Employee workspace for attendance, WFH, leave, expenses, contracts, and payslips.
- Team Lead approval inbox connected to employee requests.
- HR workspace for employee records, onboarding, contracts, and offboarding.
- Admin workspace for permissions, delegated access, access reviews, and audit views.
- Shared email interface, AI CV review, and WFH evidence-review workspaces.
- Permission evaluation by resource, action, and scope, with separate handling for visible, masked, and hidden fields.

The demo includes seven personas, responsive navigation, dark/light themes, and linked state changes across workflows.

## Run locally

```bash
git clone https://github.com/alyss1801/DACN_oHRiise.git
cd DACN_oHRiise
npm install
npm run dev
```

Open <http://localhost:3000> and use the prefilled demo login.

## Quality checks

```bash
npm run lint
npm run build
```

## Implementation notes

Business data and mutations use browser-side mock state. Backend services, durable storage, and production authorization enforcement are not connected. AI workspaces demonstrate review flows rather than a deployed inference service.

The brand logo is stored at `public/brand/ohriise-logo.png`. Module illustrations are mapped in [lib/module-visuals.ts](lib/module-visuals.ts) and stored under `public/assets/ohriise/`.
