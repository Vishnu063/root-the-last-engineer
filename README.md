# ROOT — The Last Engineer

The city fell on your first night shift. Your mentor is missing. A damaged robot named Patch has one message: **“Don't restart everything. Find what changed.”**

Explore Nexus, follow recovery signals and restore its systems through 500 DevOps questions. The story follows a junior engineer growing into the incident commander who must stop OVERSEER from shutting the city down.

![Nexus — original title artwork](assets/nexus-art.svg)

## Play locally

Requires Python 3. No npm install or cloud account is needed to play.

```bash
python3 -m http.server 8080
```

Open **http://localhost:8080**. Move with WASD, arrow keys or the touch controls. Approach the glowing beacon and press **E**, or choose **Investigate beacon**. **Follow signal** walks to the objective automatically.

Inspect recorded evidence, choose an answer, read the explanation and move on. Your expedition saves in this browser. Closing or reloading an encounter preserves wrong choices and lifelines already spent. Clearing browser site data deletes the save.

## What's playable

- **500 questions across ten chapters**, with four options per question.
- 30 introductory encounters, then **94 incident cases with five different questions each**: diagnose, investigate, repair, verify and prevent. These are five stages of an incident, not 470 unrelated incidents.
- **100 extreme encounters at questions 401–500**, covering interacting failures, data safety, failover, automation conflicts and incident coordination.
- An explorable procedural city, a visible engineer and Patch, district colors, recovery beacons, original title/story artwork, checkpoint effects and an ending.
- Three health, XP, a city map, an explanation journal, keyboard/touch controls, an automatic navigation alternative, reduced-motion effects and optional sound.

Topics include Linux, Bash, Python, Git, registries, Docker, Jenkins, GitHub Actions, GitLab CI, Azure DevOps, Terraform, OpenTofu, Ansible, AWS, Azure, GCP, Kubernetes, Helm, Argo CD, Flux, monitoring, security tools, databases and messaging. This is broad scenario coverage, not a complete course or live integration for every tool.

## The ten chapters

| Level | Questions | Chapter |
|---|---|---|
| 1 | 1–50 | The Dark Workshop |
| 2 | 51–100 | The Missing History |
| 3 | 101–150 | The Broken Factory |
| 4 | 151–200 | Terraform Valley |
| 5 | 201–250 | The Cloud Islands |
| 6 | 251–300 | Kubernetes Citadel |
| 7 | 301–350 | The Watchtower |
| 8 | 351–400 | The Trust Boundary |
| 9 | 401–450 | The Cascading Dark — extreme |
| 10 | 451–500 | The Last Safe Repair — extreme |

Levels represent campaign progression, not years of professional experience. Chapter themes provide the story setting; some encounters introduce or revisit tools outside that theme.

## Lifelines

Earn **two support credits after every ten completed questions**. Credits earned before question 20 stay banked; spending unlocks at question 20.

| Lifeline | Cost | Effect |
|---|---|---|
| 50:50 | 1 support credit | Eliminates two unknown incorrect choices |
| Ask Patch | 1 support credit | Gives a diagnostic hint |
| Second Chance | 1 support credit | Absorbs the next wrong answer's health cost |
| Skip | 1 separate Skip token | Completes one question without health loss or XP |

Each standard lifeline type can be used once per question. Skip tokens arrive **only at 100, 200 and 300 completed questions**, one at each milestone. Unused tokens accumulate. No Skip rewards at 400 or 500. Skipped questions count toward completion milestones. At zero health Patch returns you to the workshop with three health; completed questions and unspent rewards remain safe.

## Development and checks

Node 22+ is used for development checks. Gameplay itself uses browser-native modules and Canvas.

```bash
npm test
npm run build:campaign
```

`content/incidents.tsv` is the editable case source. Each row contains evidence, diagnosis, investigation, repair, verification and prevention. The build script produces `campaign.js`; commit both source and output. Distractors are phase-matched alternatives from other cases in the same campaign band. This keeps options consistent, but more closely matched hand-authored distractors would improve challenge quality.

To run real browser checks:

```bash
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium
npm run test:browser
```

The GitHub Actions workflow runs engine/content checks, verifies reproducible campaign generation, runs desktop/mobile browser checks and uploads screenshots. Browser checks cover answers, reload persistence, lifeline spending, milestones, Skip, extreme content, the ending and reduced-motion navigation.

## Scope and limitations

This is a playable learning-game prototype. Questions simulate decisions; commands do not execute against real infrastructure. Later questions link to official references, but the bank has not received independent expert review. Difficulty is editorial and has not been calibrated with learners. The boss encounters are story and question checkpoints; there is no action-combat system. No video cutscenes, multiplayer, accounts, cloud saves or sandbox terminals are included.

The remaining quality work is learner playtesting, stronger scenario-specific distractors, more environmental puzzles, deeper tool tracks and independent technical review. See `content/ART.md` for artwork provenance.
