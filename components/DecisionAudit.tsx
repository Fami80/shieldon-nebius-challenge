import type { DecisionRecord } from "../lib/investigation";

type Props = {
  records: DecisionRecord[];
  caseTitle: string;
};

export function DecisionAudit({ records, caseTitle }: Props) {
  function exportRegister() {
    const blob = new Blob([JSON.stringify({ caseTitle, exportedAt: new Date().toISOString(), decisions: records }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${caseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "shieldon"}-decision-register.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="audit-panel">
      <div>
        <p className="eyebrow">DECISION RECORD</p>
        <h2>Governance audit trail</h2>
      </div>
      {records.length === 0 ? (
        <p className="locked-copy">Every approval or rejection will retain its reviewer, rationale, timestamp and evidence links.</p>
      ) : (
        <div className="audit-content">
          <div className="audit-list">
            {records.map((record) => (
              <article key={`${record.findingId}-${record.decidedAt}`}>
                <span className={`decision ${record.decision}`}>{record.decision}</span>
                <div><strong>{record.findingId} · {record.findingTitle}</strong><p>{record.rationale}</p><small>{record.reviewer} · {new Date(record.decidedAt).toLocaleString()} · {record.evidenceIds.join(", ")}</small></div>
              </article>
            ))}
          </div>
          <button type="button" className="export-register" onClick={exportRegister}>Export decision register</button>
        </div>
      )}
    </section>
  );
}
