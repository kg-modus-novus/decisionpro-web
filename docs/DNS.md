# DecisionPro marketing DNS

Marketing repository for Vercel hosting of `DecisionPro.io`.

Product demo DNS (`demo.DecisionPro.io`) is documented in the DecisionPro repo
(`docs/DNS.md`) and must remain pointed at GitHub Pages, not Vercel.

## Live URLs

| Surface | URL |
|---|---|
| Marketing (ready now) | https://decisionpro-web.vercel.app |
| Marketing (after DNS) | https://DecisionPro.io · https://www.DecisionPro.io |
| Demo (ready now) | https://kg-modus-novus.github.io/DecisionPro/ |
| Demo (after DNS) | https://demo.DecisionPro.io |

## Vercel project status

- Team: `modus-novus`
- Project: `decisionpro-web` (`prj_EVZLCszTKnv7Z8qzlLJ6sOAoNnUF`)
- Domains already attached: `decisionpro.io`, `www.decisionpro.io` (verified at project level)
- Production aliases already point at the current deployment

CLI `domains add` may report `alias_conflict` because the domains are already
assigned to this project — that is expected, not a second-owner problem.

## GoDaddy DNS (Director)

Keep GoDaddy nameservers. Add:

| Type | Name | Value |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |
| CNAME | `demo` | `kg-modus-novus.github.io` |

After apex/`www` resolve to Vercel, HTTPS certificates issue automatically.

## Marketing CTA note

Until `demo.DecisionPro.io` resolves, site CTAs use the working GitHub Pages demo
URL. After the demo CNAME and GitHub Pages custom domain are live, switch CTAs in
`index.html` back to `https://demo.DecisionPro.io` and redeploy.
