import type { InvestigationInput } from "../lib/investigation";

type Props = {
  input: InvestigationInput;
  isAnalyzing: boolean;
  onChange: (input: InvestigationInput) => void;
  onRun: () => void;
};

export function InvestigationIntake({ input, isAnalyzing, onChange, onRun }: Props) {
  function updateEvidence(index: number, field: "source" | "label" | "detail", value: string) {
    onChange({
      ...input,
      evidence: input.evidence.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    });
  }

  function addEvidence() {
    if (input.evidence.length >= 6) return;
    onChange({ ...input, evidence: [...input.evidence, { source: "", label: "", detail: "" }] });
  }

  function removeEvidence(index: number) {
    if (input.evidence.length === 1) return;
    onChange({ ...input, evidence: input.evidence.filter((_, itemIndex) => itemIndex !== index) });
  }

  return (
    <details className="intake-panel">
      <summary>
        <span><small>01 · INTAKE</small><strong>Configure investigation</strong></span>
        <em>Edit the live case and evidence</em>
      </summary>
      <div className="intake-body">
        <div className="intake-fields">
          <label>
            <span>CASE TITLE</span>
            <input value={input.title} maxLength={100} onChange={(event) => onChange({ ...input, title: event.target.value })} />
          </label>
          <label>
            <span>INVESTIGATION OBJECTIVE</span>
            <textarea value={input.objective} maxLength={500} rows={3} onChange={(event) => onChange({ ...input, objective: event.target.value })} />
          </label>
        </div>

        <div className="evidence-editor">
          <div className="editor-head">
            <div><span>INTERNAL EVIDENCE</span><small>{input.evidence.length}/6 items</small></div>
            <button type="button" onClick={addEvidence} disabled={input.evidence.length >= 6}>+ Add evidence</button>
          </div>
          {input.evidence.map((item, index) => (
            <fieldset key={index}>
              <legend>E-{String(index + 1).padStart(2, "0")}</legend>
              <label><span>SOURCE</span><input value={item.source} maxLength={80} placeholder="CRM export" onChange={(event) => updateEvidence(index, "source", event.target.value)} /></label>
              <label><span>LABEL</span><input value={item.label} maxLength={100} placeholder="Lead response time" onChange={(event) => updateEvidence(index, "label", event.target.value)} /></label>
              <label className="wide"><span>EVIDENCE DETAIL</span><textarea value={item.detail} maxLength={1000} rows={2} placeholder="State the observed fact, metric or contradiction." onChange={(event) => updateEvidence(index, "detail", event.target.value)} /></label>
              <button className="remove-evidence" type="button" onClick={() => removeEvidence(index)} disabled={input.evidence.length === 1} aria-label={`Remove evidence ${index + 1}`}>Remove</button>
            </fieldset>
          ))}
        </div>

        <div className="intake-run">
          <p>ShieldOn does not persist this demo input. Tavily researches the objective, then Nemotron analyses the combined evidence.</p>
          <button type="button" onClick={onRun} disabled={isAnalyzing}>{isAnalyzing ? "Researching and analysing…" : "Run grounded investigation"}</button>
        </div>
      </div>
    </details>
  );
}
