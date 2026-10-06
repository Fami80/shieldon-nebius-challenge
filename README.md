# ShieldOn Nebius Challenge

ShieldOn is a governed AI-assisted business investigation system. This challenge edition investigates evidence, identifies contradictions and revenue risks, links findings to their sources, and keeps a human in control of final approval.

## Status

Challenge scope frozen. The first governed investigation demo is implemented locally.

See [CHALLENGE-SCOPE.md](./CHALLENGE-SCOPE.md) for the approved product journey and submission requirements.

## Planned challenge stack

- NVIDIA Nemotron through Nebius
- Tavily for controlled external evidence research
- Human approval and rejection controls
- Public working demo and open-source challenge implementation

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

The current interface uses a seeded demonstration case so the governance journey can be reviewed without credentials. Live Nebius and Tavily integrations are the next implementation milestone.

## Governance invariant

A candidate finding cannot produce a revenue action while it is pending or rejected. Only an explicit human approval unlocks a governed action, and the source finding remains linked.

## License

MIT
