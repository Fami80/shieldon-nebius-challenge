import type { InvestigationInput } from "../lib/investigation";

type Props = {
  input: InvestigationInput;
  isAnalyzing: boolean;
  isSampleInput: boolean;
  onChange: (input: InvestigationInput) => void;
  onRun: () => void;
};

export function InvestigationIntake({ input, isAnalyzing, isSampleInput, onChange, onRun }: Props) {
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
        <em>{isSampleInput ? "Sample case · synthetic inputs only" : "Reviewer-entered case"}</em>
      </summary>
      <div className="intake-body">
        <div className="sample-disclosure intake-disclosure" role="note"><strong>{isSampleInput ? "Synthetic sample data" : "Input handling"}</strong><span>{isSampleInput ? "These metrics are illustrative, not verified business facts. " : ""}The current case and decisions save in this browser only. Running sends the case and evidence to Nebius and Tavily and may use your configured API credits.</span></div>
        <div className="intake-fields">
          <label>
            <span>CASE TITLE</span>
            <input value={input.title} maxLength={100} disabled={isAnalyzing} onChange={(event) => onChange({ ...input, title: event.target.value })} />
          </label>
          <label>
            <span>INVESTIGATION OBJECTIVE</span>
            <textarea value={input.objective} maxLength={500} disabled={isAnalyzing} rows={3} onChange={(event) => onChange({ ...input, objective: event.target.value })} />
          </label>
        </div>

        <div className="evidence-editor">
          <div className="editor-head">
            <div><span>INTERNAL EVIDENCE</span><small>{input.evidence.length}/6 items</small></div>
            <button type="button" onClick={addEvidence} disabled={isAnalyzing || input.evidence.length >= 6}>+ Add evidence</button>
          </div>
          {input.evidence.map((item, index) => (
            <fieldset key={index}>
              <legend>E-{String(index + 1).padStart(2, "0")}</legend>
              <label><span>SOURCE</span><input value={item.source} maxLength={80} disabled={isAnalyzing} placeholder="CRM export" onChange={(event) => updateEvidence(index, "source", event.target.value)} /></label>
              <label><span>LABEL</span><input value={item.label} maxLength={100} disabled={isAnalyzing} placeholder="Lead response time" onChange={(event) => updateEvidence(index, "label", event.target.value)} /></label>
              <label className="wide"><span>EVIDENCE DETAIL</span><textarea value={item.detail} maxLength={1000} disabled={isAnalyzing} rows={2} placeholder="State the observed fact, metric or contradiction." onChange={(event) => updateEvidence(index, "detail", event.target.value)} /></label>
              <button className="remove-evidence" type="button" onClick={() => removeEvidence(index)} disabled={isAnalyzing || input.evidence.length === 1} aria-label={`Remove evidence ${index + 1}`}>Remove</button>
            </fieldset>
          ))}
        </div>

        <div className="intake-run">
          <p>The investigation is not sent until you run it. Each run calls Tavily and Nebius and may use your configured API credits.</p>
          <button type="button" onClick={onRun} disabled={isAnalyzing}>{isAnalyzing ? "Researching and analysing…" : "Run grounded investigation"}</button>
        </div>
      </div>
    </details>
  );
}
