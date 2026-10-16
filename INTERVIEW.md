# ROOT — The Last Engineer: reviewer guide

A browser-native adventure prototype with a separate 500-question DevOps training campaign.

## Start the review

Demonstrate an adventure repair and a training explanation, then explain progression tests, local saves, and the limits of simulated infrastructure.

| Source | Review focus |\n| --- | --- |\n| [package.json](package.json) | Implementation, assumptions, and operational boundaries |\n| [.github/workflows/docs.yml](.github/workflows/docs.yml) | Triggers, credentials, failure handling, and deploy conditions |\n| [.github/workflows/quality.yml](.github/workflows/quality.yml) | Triggers, credentials, failure handling, and deploy conditions |\n| [scripts/adventure-browser.mjs](scripts/adventure-browser.mjs) | Implementation, assumptions, and operational boundaries |\n| [scripts/browser-check.mjs](scripts/browser-check.mjs) | Implementation, assumptions, and operational boundaries |\n| [scripts/build-campaign.mjs](scripts/build-campaign.mjs) | Implementation, assumptions, and operational boundaries |

## First demonstration

From a checked-out repository, start with:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080 and demonstrate one Adventure puzzle. Use a fresh browser profile if you want to keep an existing save.

## A useful interview walkthrough

1. State the problem and the specific part you implemented or changed.
2. Open the source above and follow one request, release, or failure from start to finish.
3. Show a reproducible result, including an actual failure and the observation that confirms recovery.
4. Explain one tradeoff and one limitation. Distinguish a local test from a live deployment.

## Evidence and limits

This guide is based on the default-branch source inspected on 16 October 2026. It is a source review, not a fresh deployment or a certification of every feature. Existing CI runs and tests should be checked at the commit being demonstrated. Do not present screenshots, inherited code, planned features, or old README statements as proof of a current deployment.
