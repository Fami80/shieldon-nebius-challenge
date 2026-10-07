"use client";

import { useMemo, useState } from "react";
import { DecisionAudit } from "../components/DecisionAudit";
import { InvestigationIntake } from "../components/InvestigationIntake";
import { evidence as initialEvidence, governedActions, initialFindings, type Decision, type DecisionRecord, type Evidence, type Finding, type InvestigationInput } from "../lib/investigation";

const steps = ["Intake", "Evidence", "Analysis", "Decision", "Action"];
const defaultInput: InvestigationInput = {
  title: "Revenue leakage assessment",
  objective: "Identify evidence-backed revenue leakage and the safest next actions to validate or recover it.",
  evidence: initialEvidence.filter((item) => !item.external).map(({ source, label, detail }) => ({ source, label, detail })),
};

function StatusMark({ status }: { status: "done" | "active" | "locked" }) {
  return <span className={`status-mark ${status}`} aria-hidden="true">{status === "done" ? "✓" : status === "active" ? "•" : ""}</span>;
}

export default function Home() {
  const [findings, setFindings] = useState<Finding[]>(initialFindings);
  const [evidence, setEvidence] = useState<Evidence[]>(initialEvidence);
  const [selectedId, setSelectedId] = useState("F-01");
  const [notice, setNotice] = useState("Analysis complete · 3 candidate findings require human review");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [input, setInput] = useState<InvestigationInput>(defaultInput);
  const [caseTitle, setCaseTitle] = useState(defaultInput.title);
  const [researchQuery, setResearchQuery] = useState("");
  const [reviewer, setReviewer] = useState("Fahmi Al Mughairy");
  const [rationale, setRationale] = useState("");
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const selected = findings.find((finding) => finding.id === selectedId) ?? findings[0];
  const actions = useMemo(() => governedActions(findings), [findings]);
  const reviewed = findings.filter((finding) => finding.decision !== "pending").length;

  function decide(decision: Exclude<Decision, "pending">) {
    setFindings((current) => current.map((finding) => finding.id === selected.id ? { ...finding, decision } : finding));
    const record: DecisionRecord = {
      findingId: selected.id,
      findingTitle: selected.title,
      decision,
      reviewer: reviewer.trim() || "Human reviewer",
      rationale: rationale.trim() || (decision === "approved" ? "Evidence reviewed and action authorised." : "Evidence reviewed and finding not authorised."),
      decidedAt: new Date().toISOString(),
      evidenceIds: selected.evidenceIds,
    };
    setDecisions((current) => [...current.filter((item) => item.findingId !== selected.id), record]);
    setRationale("");
    setNotice(`${selected.id} ${decision} by ${record.reviewer} · audit record retained`);
  }

  async function runLiveAnalysis() {
    setIsAnalyzing(true);
    setNotice("Tavily is researching · Nemotron will analyze the grounded evidence…");
    try {
      const response = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await response.json() as { findings?: Finding[]; evidence?: Evidence[]; model?: string; groundedBy?: string; caseTitle?: string; researchQuery?: string; error?: string };
      if (!response.ok || !payload.findings || !payload.evidence) throw new Error(payload.error ?? "Live analysis failed.");
      setFindings(payload.findings);
      setEvidence(payload.evidence);
      setSelectedId(payload.findings[0].id);
      setDecisions([]);
      setCaseTitle(payload.caseTitle ?? input.title);
      setResearchQuery(payload.researchQuery ?? "");
      const externalCount = payload.evidence.filter((item) => item.external).length;
      setNotice(`Live analysis complete · ${payload.findings.length} candidates · ${externalCount} Tavily sources`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Live analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="ShieldOn home">
          <span className="brand-mark">S</span>
          <span>SHIELDON</span>
        </a>
        <div className="environment"><span /> CHALLENGE DEMO</div>
        <button className="avatar" aria-label="Open profile">FA</button>
      </header>

      <section className="shell" id="top">
        <aside className="rail" aria-label="Investigation progress">
          <p className="eyebrow">INVESTIGATION</p>
          <h2>{caseTitle}</h2>
          <p className="case-id">CASE · SH-1024</p>
          <ol className="progress-list">
            {steps.map((step, index) => {
              const status = index < 3 ? "done" : index === 3 ? "active" : actions.length ? "done" : "locked";
              return <li className={status} key={step}><StatusMark status={status} /><span><small>0{index + 1}</small>{step}</span></li>;
            })}
          </ol>
          <div className="model-card">
            <p>ANALYSIS ENGINE</p>
            <strong>NVIDIA Nemotron</strong>
            <span>via Nebius · grounded by Tavily</span>
          </div>
        </aside>

        <section className="workspace">
          <InvestigationIntake input={input} isAnalyzing={isAnalyzing} onChange={setInput} onRun={runLiveAnalysis} />
          <div className="workspace-head">
            <div>
              <p className="eyebrow">HUMAN DECISION GATE</p>
              <h1>Candidate findings</h1>
              <p>AI can investigate and recommend. Only you can govern a finding.</p>
            </div>
            <div>
              <button className="live-analysis" onClick={runLiveAnalysis} disabled={isAnalyzing}>
                {isAnalyzing ? "Researching…" : "Run live investigation"}
              </button>
              <div className="review-count"><strong>{reviewed}/{findings.length}</strong><span>reviewed</span></div>
            </div>
          </div>

          <div className="notice" role="status"><span>✦</span>{notice}</div>
          {researchQuery ? <p className="research-query"><span>TAVILY RESEARCH QUERY</span>{researchQuery}</p> : null}

          <div className="decision-grid">
            <div className="finding-list" aria-label="Candidate findings">
              {findings.map((finding) => (
                <button key={finding.id} className={`finding-row ${selected.id === finding.id ? "selected" : ""}`} onClick={() => setSelectedId(finding.id)}>
                  <span className={`severity ${finding.severity}`}>{finding.severity}</span>
                  <span className="finding-copy"><small>{finding.id}</small><strong>{finding.title}</strong><em>{finding.impact}</em></span>
                  <span className={`decision ${finding.decision}`}>{finding.decision === "pending" ? "Review" : finding.decision}</span>
                </button>
              ))}
            </div>

            <article className="finding-detail">
              <div className="detail-title"><span className={`severity ${selected.severity}`}>{selected.severity}</span><span>{selected.id}</span></div>
              <h2>{selected.title}</h2>
              <p className="summary">{selected.summary}</p>
              <div className="impact-card"><span>REVENUE EXPOSURE</span><strong>{selected.impact}</strong></div>

              <div className="section-label"><span>EVIDENCE TRACE</span><em>{selected.evidenceIds.length} linked sources</em></div>
              <div className="evidence-list">
                {selected.evidenceIds.map((id) => {
                  const item = evidence.find((entry) => entry.id === id)!;
                  if (!item) return null;
                  return <div className="evidence-item" key={id}><span>{item.id}</span><div><strong>{item.label}</strong><p>{item.detail}</p>{item.url ? <a href={item.url} target="_blank" rel="noreferrer">{item.source}{typeof item.relevance === "number" ? ` · ${Math.round(item.relevance * 100)}% relevance` : ""} ↗</a> : <small>{item.source}</small>}</div></div>;
                })}
              </div>

              <div className="confidence"><span>MODEL ASSESSMENT</span><strong>{selected.confidence}</strong><p>This is a candidate finding, not an approved business fact.</p></div>

              <div className="decision-box">
                <p>YOUR DECISION</p>
                <div className="reviewer-fields">
                  <label><span>REVIEWER</span><input value={reviewer} maxLength={80} onChange={(event) => setReviewer(event.target.value)} /></label>
                  <label><span>RATIONALE</span><textarea value={rationale} maxLength={500} rows={2} placeholder="Why are you approving or rejecting this finding?" onChange={(event) => setRationale(event.target.value)} /></label>
                </div>
                <div>
                  <button className="reject" onClick={() => decide("rejected")}>Reject finding</button>
                  <button className="approve" onClick={() => decide("approved")}>Approve as governed</button>
                </div>
                <small>Decision, reviewer and evidence links will be retained.</small>
              </div>
            </article>
          </div>

          <section className={`actions-panel ${actions.length ? "unlocked" : ""}`}>
            <div><p className="eyebrow">GOVERNED OUTPUT</p><h2>Revenue action register</h2></div>
            {actions.length === 0 ? <p className="locked-copy"><span>⌾</span> No action can be issued until a human approves at least one finding.</p> : (
              <div className="action-list">{actions.map((item, index) => <div key={item.findingId}><span>0{index + 1}</span><p><small>FROM {item.findingId} · HUMAN APPROVED</small>{item.action}</p></div>)}</div>
            )}
          </section>
          <DecisionAudit records={decisions} caseTitle={caseTitle} />
        </section>
      </section>
    </main>
  );
}
