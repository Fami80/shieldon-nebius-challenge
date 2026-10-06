"use client";

import { useMemo, useState } from "react";
import { evidence, governedActions, initialFindings, type Decision, type Finding } from "../lib/investigation";

const steps = ["Intake", "Evidence", "Analysis", "Decision", "Action"];

function StatusMark({ status }: { status: "done" | "active" | "locked" }) {
  return <span className={`status-mark ${status}`} aria-hidden="true">{status === "done" ? "✓" : status === "active" ? "•" : ""}</span>;
}

export default function Home() {
  const [findings, setFindings] = useState<Finding[]>(initialFindings);
  const [selectedId, setSelectedId] = useState("F-01");
  const [notice, setNotice] = useState("Analysis complete · 3 candidate findings require human review");
  const selected = findings.find((finding) => finding.id === selectedId) ?? findings[0];
  const actions = useMemo(() => governedActions(findings), [findings]);
  const reviewed = findings.filter((finding) => finding.decision !== "pending").length;

  function decide(decision: Exclude<Decision, "pending">) {
    setFindings((current) => current.map((finding) => finding.id === selected.id ? { ...finding, decision } : finding));
    setNotice(`${selected.id} ${decision} by Fahmi Al Mughairy · decision recorded`);
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
          <h2>Revenue leakage<br />assessment</h2>
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
            <span>via Nebius · demo dataset</span>
          </div>
        </aside>

        <section className="workspace">
          <div className="workspace-head">
            <div>
              <p className="eyebrow">HUMAN DECISION GATE</p>
              <h1>Candidate findings</h1>
              <p>AI can investigate and recommend. Only you can govern a finding.</p>
            </div>
            <div className="review-count"><strong>{reviewed}/{findings.length}</strong><span>reviewed</span></div>
          </div>

          <div className="notice" role="status"><span>✦</span>{notice}</div>

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
                  return <div className="evidence-item" key={id}><span>{item.id}</span><div><strong>{item.label}</strong><p>{item.detail}</p><small>{item.source}{item.external ? " ↗" : ""}</small></div></div>;
                })}
              </div>

              <div className="confidence"><span>MODEL ASSESSMENT</span><strong>{selected.confidence}</strong><p>This is a candidate finding, not an approved business fact.</p></div>

              <div className="decision-box">
                <p>YOUR DECISION</p>
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
        </section>
      </section>
    </main>
  );
}
