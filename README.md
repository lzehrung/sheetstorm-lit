# Sheetstorm

## Description

The goal: an open source alternative to Flatfile. Accept user tabular data with headless TypeScript code or launch a modal component with an import wizard workflow.

Currently publishes 2 components:
- `sheetstorm-import` - the workflow component where users select a file and map columns to a target schema and preview the data
- `sheetstorm-modal` - a simple modal that wraps `sheetstorm-import`; useful for easy plug & play and not impacting your existing app UI

Usable in React, Angular, Vue, and vanilla JavaScript.

## Development

```bash
npm i
npm run start
```
This will start a storybook instance and the unit tests which will both rebuild on code changes.
