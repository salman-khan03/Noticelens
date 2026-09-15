"use client";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "./button";
import {
  analysisSchema,
  claimSchema,
  evaluationSchema,
  request,
  type Analysis,
  type Claim,
  type Evaluation,
} from "@/lib/contracts";
export function Safety({ analysis }: { analysis: Analysis }) {
  const [probe, setProbe] = useState(
    "You always have 14 days to respond to this notice.",
  );
  const [result, setResult] = useState<Claim | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const m = analysisSchema.parse(analysis).metrics;
  async function test() {
    setBusy(true);
    setError("");
    try {
      const base = analysis.claims.find((c) => c.source);
      setResult(
        claimSchema.parse(
          await request("/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: "user-probe",
              claim: probe,
              jurisdiction: analysis.jurisdiction,
              ruleId: base?.ruleId,
              sourceId: base?.sourceId,
              sourceUrl: base?.sourceUrl,
              supportingPassage: base?.supportingPassage,
            }),
          }),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section id="proof" className="panel safety">
      <div className="section-heading">
        <ShieldCheck size={23} />
        <h2>The Proof Gate</h2>
        <span className="muted">Evidence before confidence.</span>
      </div>
      <div className="metrics">
        {[
          [m.claimsChecked, "Claims checked"],
          [m.supported, "Supported"],
          [m.blocked, "Blocked"],
          [`${m.citationCoverage}%`, "Citation coverage"],
          [m.sourcesUsed, "Sources used"],
        ].map(([v, k]) => (
          <div key={k}>
            <strong>{v}</strong>
            <span>{k}</span>
          </div>
        ))}
      </div>
      <p className="fine">
        Coverage = verified claims with approved evidence ÷ all candidate
        claims. Blocked claims count against coverage. Human review required:
        yes. No confidence scores are invented.
      </p>
      <details className="probe">
        <summary>
          Try to break it <span>Test an unsupported claim</span>
        </summary>
        <label htmlFor="probe">
          Candidate claim (checked against this notice’s first retrieved source)
        </label>
        <textarea
          id="probe"
          value={probe}
          maxLength={2000}
          onChange={(e) => setProbe(e.target.value)}
        />
        <Button onClick={test} disabled={busy || !probe.trim()}>
          {busy ? "Checking…" : "Run Proof Gate"}
        </Button>
        {result && (
          <div
            role="status"
            className={
              result.verificationStatus === "VERIFIED" ? "success" : "alert"
            }
          >
            <strong>{result.verificationStatus}</strong>
            <p>{result.reason}</p>
          </div>
        )}
        {error && <p role="alert">{error}</p>}
      </details>
      <Button
        variant="ghost"
        onClick={async () => {
          try {
            setEvaluation(evaluationSchema.parse(await request("/evaluation")));
          } catch {
            setError("Evaluation results unavailable. Check the backend.");
          }
        }}
      >
        View measured evaluation
      </Button>
      {evaluation && (
        <div className="evaluation">
          {evaluation.available ? (
            <>
              <strong>
                {evaluation.passed}/{evaluation.total} gate checks passed
              </strong>
              <p>
                Unsupported rejection: {evaluation.unsupportedRejectionRate}% ·
                Retrieval success: {evaluation.retrievalSuccessRate}% ·{" "}
                {evaluation.elapsedMs} ms
              </p>
              <p>{evaluation.scope}</p>
              <small>Run: {evaluation.runAt}</small>
              <ul>
                {evaluation.cases?.map((c) => (
                  <li key={c.scenario}>
                    {c.passed ? "Pass" : "Fail"} — {c.scenario}: {c.actual}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>No evaluation run yet. Run the backend evaluation command.</p>
          )}
        </div>
      )}
    </section>
  );
}
