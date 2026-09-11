# GitHub publication strategy

This document records how AirSwasthya AI is published without overstating the project or leaking local/private material.

## Design path

1. **Design:** Keep the repo understandable for judges: purpose first, source boundary second, quick-start third, verification evidence close to the top.
2. **Implementation plan:** Keep source code, tests, docs, and safe generated metrics in Git. Keep raw datasets, private credentials, generated build folders, and release ZIPs out of Git.
3. **Build design:** Use a private master repository for the full working record and a public showcase repository for sanitized portfolio review.
4. **Architecture execution:** Preserve the existing Python + Streamlit + Next.js architecture instead of hiding it behind a fake production story.
5. **Re-analysis:** Re-run checks before each push and keep readiness percentages honest.

## Public/private split

| Repository type | Purpose | Includes | Excludes |
| --- | --- | --- | --- |
| Private master | Full project working record | Source, docs, tests, safe metrics, future local evidence, final report/PPT work | Nothing unsafe should be committed, but ignored local evidence can remain in the working folder. |
| Public showcase | Recruiter/judge-friendly GitHub page | Sanitized source, tests, setup docs, placeholder `.env.example`, safe metrics | `.env`, raw datasets, generated forecasts, local OSPCB PDFs, virtual environments, build folders, caches, ZIPs, private screenshots. |

## README tradeoffs borrowed from strong public repositories

- Open with one clear sentence about the project instead of a long abstract.
- Show status early so visitors know what is working.
- Separate "what it does" from "what it does not claim."
- Put installation and verification commands in copyable blocks.
- Keep architecture readable before deep implementation details.
- Use proof sections: tests, build, scan, and data-boundary notes.
- Avoid listing technologies that are not actually used by the code.

## Current readiness

| Track | Current score | Reason |
| --- | ---: | --- |
| GitHub publication | 85/100 | Private repo exists, public-safe commit is clean, docs are polished, checks pass, and ignored artifacts are confirmed. |
| Review 2 demo implementation | 80/100 | Forecasting, dashboards, tests, and metrics exist, but final screenshots/report/PPT are still pending. |
| Scientific/local accuracy validation | 45/100 | The current forecast uses gridded PM2.5 data; local ground-sensor daily validation is not yet available. |
| Final academic submission | 65/100 | Strong scaffold and demo, but final deliverables and literature evidence still need completion. |

## Pre-push gate

- Confirm repository names and visibility.
- Confirm current branch and remotes.
- Confirm `.env`, raw data, generated data, `.venv`, caches, and build folders are ignored.
- Run Python tests.
- Run frontend typecheck, lint, and production build.
- Scan committed source for common secret patterns without printing secret values.
- Push private master first.
- Push public showcase only after the sanitized commit is verified.

## Honest claim boundary

AirSwasthya AI is a strong Review 2 academic demo and GitHub portfolio package. It should be described as an explainable PM2.5/AQI advisory project with gridded-data forecasting and official monthly-source context. It should not be described as a certified, production, live, or ground-station-validated public-health system.
