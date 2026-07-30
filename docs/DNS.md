# DecisionPro marketing DNS

Marketing repository for Vercel hosting of `DecisionPro.io`.

Product demo DNS (`demo.DecisionPro.io`) is documented in the DecisionPro repo
(`docs/DNS.md`) and must remain pointed at GitHub Pages, not Vercel.

After `vercel` links this project, open the Vercel Domains panel and add:

- `DecisionPro.io`
- `www.DecisionPro.io`

Then apply the exact A/CNAME records Vercel displays in GoDaddy.
