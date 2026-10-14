"use client";

import { useEffect, useMemo, useState } from "react";
import { DecisionAudit } from "../components/DecisionAudit";
import { InvestigationIntake } from "../components/InvestigationIntake";
import { evidence as initialEvidence, governedActions, numberEvidence, type Decision, type DecisionRecord, type Evidence, type Finding, type InvestigationInput } from "../lib/investigation";

const steps = ["Intake", "Evidence", "Analysis", "Decision", "Action"];
const STORAGE_KEY = "shieldon-nebius-demo:v1";

type SavedDemoState = {
  findings: Finding[];
  evidence: Evidence[];
  selectedId: string;
  caseTitle: string;
  researchQuery: string;
  decisions: DecisionRecord[];
  input: InvestigationInput;
};
const defaultInput: InvestigationInput = {
  title: "Subscription retention review",
  objective: "Identify evidence-backed drivers of subscription churn and safe actions to validate.",
  evidence: initialEvidence.filter((item) => !item.external).map(({ source, label, detail }) => ({ source, label, detail })),
};

function StatusMark({ status }: { status: "done" | "active" | "locked" }) {
  return <span className={`status-mark ${status}`} aria-hidden="true">{status === "done" ? "✓" : status === "active" ? "•" : ""}</span>;
}

export default function Home() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>(numberEvidence(defaultInput.evidence));
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("Sample inputs loaded · run a live investigation to generate findings");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [input, setInput] = useState<InvestigationInput>(defaultInput);
  const [caseTitle, setCaseTitle] = useState(defaultInput.title);
  const [researchQuery, setResearchQuery] = useState("");
  const [reviewer, setReviewer] = useState("Fahmi Al Mughairy");
  const [rationale, setRationale] = useState("");
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const selected = findings.find((finding) => finding.id === selectedId);
  const actions = useMemo(() => governedActions(findings), [findings]);
  const reviewed = findings.filter((finding) => finding.decision !== "pending").length;
  const isSampleInput = JSON.stringify(input) === JSON.stringify(defaultInput);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<SavedDemoState>;
        if (Array.isArray(saved.findings) && Array.isArray(saved.evidence) && Array.isArray(saved.decisions) && saved.input && typeof saved.input === "object") {
          setFindings(saved.findings);
          setEvidence(saved.evidence);
          setSelectedId(typeof saved.selectedId === "string" ? saved.selectedId : "");
          setCaseTitle(typeof saved.caseTitle === "string" ? saved.caseTitle : defaultInput.title);
          setResearchQuery(typeof saved.researchQuery === "string" ? saved.researchQuery : "");
          setDecisions(saved.decisions);
          setInput(saved.input);
          setNotice("Saved demo session restored from this browser");
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    const saved: SavedDemoState = { findings, evidence, selectedId, caseTitle, researchQuery, decisions, input };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      setNotice("Browser storage is unavailable · export decisions before leaving this page");
    }
  }, [hasHydrated, findings, evidence, selectedId, caseTitle, researchQuery, decisions, input]);

  function updateInput(nextInput: InvestigationInput) {
    setInput(nextInput);
    setFindings([]);
    setEvidence(numberEvidence(nextInput.evidence));
    setSelectedId("");
    setDecisions([]);
    setResearchQuery("");
    setNotice("Inputs changed · run a new live investigation before reviewing findings");
  }

  function decide(decision: Exclude<Decision, "pending">) {
    if (!selected) return;
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
    setNotice(`${selected.id} ${decision} by ${record.reviewer} · saved in this browser`);
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
      setSelectedId(payload.findings[0]?.id ?? "");
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
          <p className="case-id">DEMO CASE · SH-RET-01</p>
          <ol className="progress-list">
            {steps.map((step, index) => {
              const status = index < 2 ? "done" : index === 2 ? (findings.length ? "done" : "active") : index === 3 ? (findings.length ? (reviewed === findings.length ? "done" : "active") : "locked") : actions.length ? "done" : "locked";
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
          <InvestigationIntake input={input} isAnalyzing={isAnalyzing} isSampleInput={isSampleInput} onChange={updateInput} onRun={runLiveAnalysis} />
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
              <div className="review-count"><strong>{findings.length ? `${reviewed}/${findings.length}` : "0"}</strong><span>{findings.length ? "reviewed" : "live findings"}</span></div>
            </div>
          </div>

          <div className="notice" role="status"><span>✦</span>{notice}</div>
          {isSampleInput && <div className="sample-disclosure" role="note"><strong>Synthetic example only</strong><span>These retention metrics are illustrative, not verified business facts. Findings from this case are demonstrations only.</span></div>}
          {researchQuery ? <p className="research-query"><span>TAVILY RESEARCH QUERY</span>{researchQuery}</p> : null}

          <div className="decision-grid">
            <div className="finding-list" aria-label="Candidate findings">
              {findings.map((finding) => (
                <button key={finding.id} className={`finding-row ${selected?.id === finding.id ? "selected" : ""}`} onClick={() => setSelectedId(finding.id)}>
                  <span className={`severity ${finding.severity}`}>{finding.severity}</span>
                  <span className="finding-copy"><small>{finding.id}</small><strong>{finding.title}</strong><em>{finding.impact}</em></span>
                  <span className={`decision ${finding.decision}`}>{finding.decision === "pending" ? "Review" : finding.decision}</span>
                </button>
              ))}
            </div>

            {selected ? (
              <article className="finding-detail">
              <div className="detail-title"><span className={`severity ${selected.severity}`}>{selected.severity}</span><span>{selected.id}</span></div>
              <h2>{selected.title}</h2>
              <p className="summary">{selected.summary}</p>
              <div className="impact-card"><span>MODEL-ESTIMATED IMPACT · VERIFY BEFORE ACTION</span><strong>{selected.impact}</strong></div>

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
                  <button className="reject" disabled={isAnalyzing} onClick={() => decide("rejected")}>Reject finding</button>
                  <button className="approve" disabled={isAnalyzing} onClick={() => decide("approved")}>Approve as governed</button>
                </div>
                <small>Saved in this browser only. Export the register for a portable copy.</small>
              </div>
              </article>
            ) : (
              <article className="finding-detail empty-state">
                <p className="eyebrow">NO LIVE FINDINGS</p>
                <h2>Run the investigation to create candidates</h2>
                <p className="summary">The example inputs above are synthetic. They cannot be approved or turned into governed actions.</p>
                <button className="live-analysis" onClick={runLiveAnalysis} disabled={isAnalyzing}>{isAnalyzing ? "Researching…" : "Run live investigation"}</button>
              </article>
            )}
          </div>

          <section className={`actions-panel ${actions.length ? "unlocked" : ""}`}>
            <div><p className="eyebrow">GOVERNED OUTPUT</p><h2>Approved action register</h2></div>
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
