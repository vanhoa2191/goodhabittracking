---
phase: 7
title: "Landing Safe conversion"
status: in_progress
priority: P2
effort: "5-7 days"
dependencies: [3, 5]
---

# Phase 7: Landing Safe conversion

## Overview

Ship the concise Safe landing before considering scroll-driven storytelling.

## Requirements

- [x] Reduce desktop content to the essential narrative, one primary hero CTA, one demo path, and compact proof.
- [x] Preserve collapsed framework/roadmap content and use a real child-world visual rather than another dense preview card.

## Implementation Steps

1. Inventory every CTA and retain one primary hierarchy.
2. Rebuild section order, measure height/CLS, and validate 375/768/1280 with localized copy.

## Todo

- [x] Desktop height is reduced by at least 60% against the 6,238px audit baseline.
- [x] Mobile has no horizontal overflow and one clear first action.

## Success Criteria

Hero media loads progressively and never blocks interaction on a slow connection.

## Validation

- 1280px landing height: 2,360px, down 62% from the 6,238px audit baseline. 375px and 768px have no horizontal overflow.
- A browser run held all three optimized mascot images pending: the primary action remained visible and enabled, and its vertical position moved 0px after image load; the demo action still opened the child view.
- Entry-journey and accessibility browser suites passed for the landing and all nine locales. The Cloudflare bundle built successfully.
- Production publication remains open until Cloudflare credentials are available to the deployment workflow and the live landing is verified.
