import { Clock3, Fingerprint, LockKeyhole, UserCheck } from "lucide-react";
import type { Analysis } from "@/lib/contracts";

export function Provenance({ analysis }: { analysis: Analysis }) {
  const receipt = analysis.provenance;
  const freshness = receipt.sourceSnapshotAgeDays;
  return (
    <section className="panel provenance-panel" aria-labelledby="receipt-title">
      <div className="section-heading">
        <Fingerprint size={23} />
        <h2 id="receipt-title">Verification receipt</h2>
        <span className="muted">
          Tamper-evident provenance for review and handoff.
        </span>
      </div>
      <div className="receipt-grid">
        <div>
          <LockKeyhole />
          <span>Input boundary</span>
          <strong>Untrusted document data</strong>
        </div>
        <div>
          <Clock3 />
          <span>Source snapshot age</span>
          <strong>
            {freshness === null
              ? "No source used"
              : `${freshness} day${freshness === 1 ? "" : "s"}`}
          </strong>
        </div>
        <div>
          <UserCheck />
          <span>Decision status</span>
          <strong>Human review required</strong>
        </div>
      </div>
      <details className="audit-trail">
        <summary>Open processing audit trail</summary>
        <ol>
          {receipt.auditTrail.map((event) => (
            <li key={event.stage}>
              <strong>{event.stage.replaceAll("_", " ")}</strong>
              <span>{event.detail}</span>
            </li>
          ))}
        </ol>
        <dl>
          <div>
            <dt>Policy</dt>
            <dd>{receipt.policyVersion}</dd>
          </div>
          <div>
            <dt>Analysis digest</dt>
            <dd>
              <code>{receipt.analysisSha256}</code>
            </dd>
          </div>
          <div>
            <dt>Source manifest digest</dt>
            <dd>
              <code>{receipt.sourceManifestSha256}</code>
            </dd>
          </div>
        </dl>
      </details>
    </section>
  );
}
