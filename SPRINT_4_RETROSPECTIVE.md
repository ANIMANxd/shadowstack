# Sprint 4 Retrospective & Lessons Learned

## Overview
**Sprint Number**: 4  
**Project**: ShadowStack (Multi-Tenant PR Cost Analyzer)  

## What Went Well
* **Successful Pivot to Multi-Tenant OAuth:** In the final sprint, we successfully adapted our core authentication architecture. We shifted from a generic, undefined login flow to a robust GitHub OAuth multi-tenant architecture. This foundation allows strict session management and paves the way for direct webhook integration.
* **Adopting Vitest over Jest:** Moving to a Vite-native test runner dramatically improved build stability. Transitioning away from Jest allowed deep compatibility with the modern Vite build ecosystem, eliminating cryptic ESM module mapping errors and substantially reducing testing latency.

## What Could Be Improved
* **Data Modeling Misalignment:** Early misunderstandings of the application's core problem—and its mock data structure—led to us inadvertently building an AWS-style billing dashboard rather than focusing on a PR-centric developer insights tool.
* **Avoidable UX Refactoring:** This initial misalignment required a heavy mid-sprint UI refactor across the dashboard to pivot the narrative toward GitHub Pull Requests and developer impact. Aligning on the precise shape of our user workflows *before* committing complex visualization code would preserve vital sprint capacity in the future.

## Action Items & Future Scope (Post-MVP)
1. **Notification Ecosystem (Slack/Email Alerting):** Implement an automated alerting hook utilizing the webhook listeners so infrastructure cost risks can be broadcasted directly into engineering Slack channels the moment a PR exceeds baseline logic.
2. **Multi-Cloud Architecture Comparisons:** Broaden the cost integration pipeline to support seamless AWS vs Azure vs GCP real-time cost comparisons, positioning ShadowStack as an aggressive cross-cloud optimizer.
