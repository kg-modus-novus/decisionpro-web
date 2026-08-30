# DecisionPro marketing site

Public marketing site for **DecisionPro**, the multi-state public-program
decision intelligence platform. Kentucky and Florida are the current state
products; both share the governed evidence-to-action operating model while
retaining state-specific sources, definitions and limitations.

A product of **XenoDroid Inc.**

## Hosting

- Repository: https://github.com/kg-modus-novus/decisionpro-web
- Production host: Vercel
- Intended domains: `https://DecisionPro.io` and `https://www.DecisionPro.io`
- Product demo (separate repo): https://demo.DecisionPro.io

## Local preview

```powershell
npm run dev
```

Open http://localhost:5050

## Notes

Static site — no build step required for Vercel. Do not add PHI, secrets, or
person-level Medicaid data.

Rendered verification:

```powershell
node docs/verify-marketing.cjs
```
