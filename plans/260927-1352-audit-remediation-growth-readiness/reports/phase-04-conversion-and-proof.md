# Phase 4 conversion and proof report

## Implemented locally

- Demo is the primary first-visit CTA; Google sign-in remains visible beside it and pricing remains reachable from both the landing page and `/pricing`.
- Mobile has a sticky demo/sign-in action bar with 48px controls.
- Long framework, roadmap and plan comparison content is no longer rendered on the landing page. Compact cards link to `/framework`, `/roadmaps` and `/pricing`.
- Vietnamese proof cards are sourced from `src/lib/public-proof.ts`; the registry currently contains product behavior only, with repository evidence and review dates. No testimonial or customer-count claim is published.
- `src/lib/public-funnel.ts` defines a strict, PII-free conversion contract and rejects extra fields. It emits only after explicit consent and when a sink is deliberately configured.

## Deliberately not enabled

- No analytics destination or persistent identifier is configured.
- No landing event is collected from first-time visitors because they have not given analytics consent.
- No conversion dashboard can be shown until destination, retention/deletion, processing region and staging validation are approved.

## Remaining release evidence

- Re-measure landing height and performance budget after the final visual pass.
- Validate a consented staging event only after the Phase 2 policy owner approves the destination and retention terms.
- Establish a real baseline before any A/B test or conversion target is claimed.
