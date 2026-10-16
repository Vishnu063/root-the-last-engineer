# ROOT — The Last Engineer

Explore Nexus with your robot Patch. Restore a city brought down by a mysterious update through DevOps encounters in an animated isometric world.

## Play

Run `python3 -m http.server 8080`, then open http://localhost:8080. No dependencies, cloud resources or credentials required. Move with WASD/arrows or touch controls; approach the mint beacon and press E. Use the Controls button for rules. Sound is opt-in. Progress saves locally in your browser. Clearing browser data removes progress.

## Honest release status

**Playable first chapter: 30 authored encounters. 500 planned; 470 remain unwritten.** Topics include Linux, networking, Git, Docker, CI/CD, Terraform, Kubernetes, observability and security. These are introductory encounters. The extreme 401–500 chapter is not implemented yet.

Implemented: exploration, procedural animated city, Patch companion, four shuffled answer options, explanations, health recovery, XP, mission journal, local progress, keyboard/touch movement and optional sound. Visuals are drawn locally using Canvas; no external assets needed. This is a simulation, not a real terminal or connected production lab. Reduced-motion preferences disable rain and pulsing effects.

## Rewards

Two support credits per ten completed encounters, banked until encounter 20. Spend one credit for 50:50, Ask Patch or Second Chance; each type once per encounter. Skip uses a separate token: exactly one awarded at 100, 200 and 300 completions. Unused tokens accumulate. No Skip rewards at 400 or 500. Skipped encounters count toward completion milestones but award no XP. Three health; zero health returns you to base with completed missions preserved.

## Verify

`npm test` runs dependency-free Node tests for reward milestones, unlocks, Skip spending, save recovery and question structure. Browser visual and interaction QA is still required before a production release.

## Remaining work

Author and technically review 470 distinct questions. Add district-specific environments, richer investigation clues, original character art and cinematics, chapter progression, boss mechanics, documentation references, experience tiers and comprehensive browser QA. Do not present this release as the finished campaign.
