# ShieldOn Nebius Challenge Scope

## Challenge target

- Hackathon: Nebius x NVIDIA Global AI Hackathon
- Primary track: Best Apps and Agents
- Secondary prize target: Best Use of Tavily
- Internal completion date: October 25, 2026
- Submission deadline: October 30, 2026 at 9:00 PM Dubai time

## Product statement

ShieldOn investigates business evidence, uses NVIDIA Nemotron through Nebius to identify contradictions and revenue risks, links every finding to its evidence, and requires human approval before producing a governed revenue action.

## Minimum submission journey

1. Create an investigation.
2. Add business evidence.
3. Search for supporting external evidence through Tavily.
4. Analyse the evidence with NVIDIA Nemotron through Nebius.
5. Generate observations, contradictions, missing-evidence items, and candidate findings.
6. Show the evidence and reasoning trace behind each candidate finding.
7. Require a human to approve or reject each candidate finding.
8. Produce a governed revenue action only from approved findings.

## Required technical proof

- The working application runs an NVIDIA open-source model through Nebius Token Factory or Nebius AI Cloud.
- Tavily evidence is visibly attributed to its source.
- Candidate findings cannot become governed findings automatically.
- Each governed finding retains evidence traceability and the human decision record.
- The deployed demo completes the full journey without manual database editing.

## Submission deliverables

- Public working deployment
- Public source repository with an open-source license
- Clear README and setup instructions
- Public demo video no longer than three minutes
- Devpost project description
- Written explanation of work completed during the competition period

## Scope boundary

This repository contains a focused challenge edition of ShieldOn. It must demonstrate the investigation and governance journey without publishing ShieldOn's private commercial methodology, internal roadmap, customer information, or unrelated Core V1 architecture.

## Definition of done

The submission is ready when a judge can create an investigation, provide evidence, run the Nebius-hosted Nemotron analysis, inspect traceable candidate findings, approve or reject them, and see a governed revenue action generated only from approved findings.
