# Untitled Beatles Story Game (working title: Liverlight '67)

> **The game title is provisional.** The current label is only a development placeholder and is not a final brand decision.

A browser-based, third-person 3D prototype inspired by real events in the history of The Beatles. The intended narrative is organized into four historical chapters, each with four character perspectives:

1. Early Days
2. The Beatles!
3. No More Concerts!
4. And in the End...

The historical timeline and real-world locations are intended to remain accurate. Character, group, song and fictional business names are working adaptations and can be revised centrally.

## Central configuration

Edit [src/data/variables.ts](src/data/variables.ts) to change:

- Provisional game title, subtitle and tagline
- Chapter and level titles and date ranges
- Fictionalized character names and descriptions
- Band, management and supporting-character names
- Adapted song titles
- Real locations and fictional businesses
- Opening mission text, historical date and dialogue

Stable IDs should be kept when changing display names so gameplay references remain intact.

## Prototype controls

- **WASD / arrow keys:** move
- **Mouse:** rotate camera (click the game to lock pointer)
- **E:** interact
- **Shift:** run
- **M:** map
- **Mobile:** on-screen movement, run and interact controls; drag the right side to look

## Development

Requirements: Node.js 22+

```bash
npm install
npm run dev
```

Build and typecheck:

```bash
npm run build
npm run typecheck
```

## Current scope and limitations

This repository currently contains an early playable prototype: a small procedural street, third-person movement, basic mobile controls, a map panel, one character interaction and one introductory dialogue/mission.

It is **not yet** the complete historical campaign. Vehicle driving, robust collisions, save/load, the 16-level progression system, full mission chains, detailed historical scenes, audio and final art are not implemented yet. Historical events and dates must be researched and checked before they are presented as factual in missions.

## Deployment

A GitHub Actions workflow is included at `.github/workflows/deploy.yml` for building and deploying to GitHub Pages. Enable GitHub Pages with **GitHub Actions** as the build and deployment source in repository settings.
