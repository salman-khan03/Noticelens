"use client";
import { useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  FileText,
  Home,
  ListChecks,
  LoaderCircle,
  Printer,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/button";
import { Evidence } from "@/components/evidence";
import { Safety } from "@/components/safety";
import { Provenance } from "@/components/provenance";
import { analysisSchema, request, type Analysis } from "@/lib/contracts";

const disclaimer =
  "NoticeLens provides informational assistance and document organization. It is not a law firm and does not provide legal representation or individualized legal advice. Verify important deadlines and decisions with the responsible authority or qualified counsel.";
export default function Page() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sample, setSample] = useState("vacate");
  const [paste, setPaste] = useState("");
  const [jurisdiction, setJurisdiction] = useState(false);
  const [draft, setDraft] = useState("");
  const [checked, setChecked] = useState<number[]>([]);
  const [active, setActive] = useState("overview");
  const file = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  async function run(path: string, init?: RequestInit) {
    setBusy(true);
    setError("");
    setAnalysis(null);
    setChecked([]);
    try {
      const data = analysisSchema.parse(await request(path, init));
      setAnalysis(data);
      setDraft(data.draft);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not analyze the notice. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  function upload(f?: File) {
    if (!f) return;
    if (!jurisdiction) {
      setError("Confirm the property is in Texas before uploading.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File exceeds 10 MB. Choose a smaller file.");
      return;
    }
    const body = new FormData();
    body.append("file", f);
    body.append("jurisdiction", "US-TX");
    void run("/upload", { method: "POST", body });
  }
  function redact(value: string) {
    return value
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED IDENTIFIER]")
      .replace(
        /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
        "[REDACTED EMAIL]",
      )
      .replace(
        /\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b/g,
        "[REDACTED PHONE]",
      )
      .replace(/^(To|From|Property):\s*.+$/gim, "$1: [REDACTED]");
  }
  async function exportPacket(redacted = true) {
    if (!analysis) return;
    const packet = {
      ...analysis,
      text: redacted ? redact(analysis.text) : analysis.text,
      facts: redacted
        ? analysis.facts.map((fact) => ({
            ...fact,
            value: redact(fact.value),
            passage: redact(fact.passage),
          }))
        : analysis.facts,
      draft: redacted ? redact(draft) : draft,
      completedActions: checked.map((i) => analysis.actions[i]),
      exportPrivacy: redacted ? "MINIMIZED" : "FULL_DOCUMENT_INCLUDED",
      disclaimer,
    };
    const canonical = JSON.stringify(packet);
    const digest = Array.from(
      new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(canonical),
        ),
      ),
    )
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    const blob = new Blob(
      [JSON.stringify({ ...packet, packetSha256: digest }, null, 2)],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = redacted
      ? "noticelens-evidence-packet-redacted.json"
      : "noticelens-evidence-packet-full.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  return (
    <div className="shell">
      <a className="skip" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <a className="brand" href="#overview">
          NoticeLens<span>TEXAS</span>
        </a>
        <p className="brand-note">
          Real notices.
          <br />
          Clear next steps.
        </p>
        <nav aria-label="Main navigation">
          {[
            ["overview", "Overview", Home],
            ["evidence", "Evidence", FileText],
            ["actions", "Action plan", ListChecks],
            ["proof", "Proof Gate", ShieldCheck],
          ].map(([id, label, Icon]) => {
            const NavIcon = Icon as typeof Home;
            return (
              <a
                key={id as string}
                className={active === id ? "active" : ""}
                href={`#${id}`}
                onClick={() => setActive(id as string)}
              >
                <NavIcon size={20} />
                {label as string}
              </a>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <ShieldCheck size={25} />
          <p>
            Information today.
            <br />A more secure tomorrow.
          </p>
          <small>Local demo · no account needed</small>
        </div>
      </aside>
      <main id="main">
        <div className="topbar">
          <ol className="steps">
            {["Upload", "Understand", "Verify", "Act"].map((s, i) => (
              <li key={s} className={analysis || i === 0 ? "done" : ""}>
                <span>{analysis && i < 3 ? <Check size={14} /> : i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <div className="jurisdiction">
            Texas <span>Tenant notices only</span>
          </div>
        </div>
        <header id="overview">
          <div>
            <h1>Clarity, backed by evidence.</h1>
            <p>
              Upload the notice. Understand what matters.
              <br className="mobile-break" /> Verify every claim. Know what to
              do next.
            </p>
          </div>
          <Button onClick={() => window.print()} disabled={!analysis}>
            <Printer size={17} /> Print packet
          </Button>
        </header>
        <div className="intro-grid">
          <section className="panel upload-panel">
            <div className="section-heading">
              <span className="step-number">01</span>
              <h2>Upload your notice</h2>
            </div>
            <p className="muted">
              Start with your document, or explore a fictional example.
            </p>
            <div className="upload-grid">
              <div>
                <label className="jurisdiction-check">
                  <input
                    type="checkbox"
                    checked={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.checked)}
                  />{" "}
                  My rental property is in Texas
                </label>
                <div
                  className={`dropzone ${dragging ? "dragging" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    if (!busy) upload(e.dataTransfer.files[0]);
                  }}
                >
                  <Upload size={28} />
                  <strong>Drop your notice here</strong>
                  <span>PDF, JPG or PNG · up to 10 MB · 10 pages</span>
                  <Button disabled={busy} onClick={() => file.current?.click()}>
                    Choose file <ArrowUpRight size={15} />
                  </Button>
                  <input
                    ref={file}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    className="sr-only"
                    aria-label="Upload notice file"
                    onChange={(e) => {
                      upload(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
              <div className="sample-picker">
                <h3>Just taking a look?</h3>
                <p>
                  Try a synthetic notice.
                  <br />
                  No personal information needed.
                </p>
                <label className="sr-only" htmlFor="sample">
                  Sample notice
                </label>
                <select
                  id="sample"
                  value={sample}
                  onChange={(e) => setSample(e.target.value)}
                >
                  <option value="vacate">Notice to vacate</option>
                  <option value="violation">Lease-violation notice</option>
                  <option value="deposit">Security-deposit dispute</option>
                </select>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(`/samples/${sample}`, { method: "POST" })}
                >
                  Load sample notice
                </Button>
              </div>
            </div>
            <details className="paste">
              <summary>Or paste the notice text</summary>
              <label htmlFor="notice-text">
                Paste 25–60,000 characters. Remove information you do not need
                analyzed.
              </label>
              <textarea
                id="notice-text"
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                maxLength={60000}
                placeholder="Paste the full notice here…"
              />
              <Button
                disabled={busy || paste.trim().length < 25 || !jurisdiction}
                onClick={() =>
                  run("/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      text: paste,
                      jurisdiction: "US-TX",
                    }),
                  })
                }
              >
                Analyze text
              </Button>
            </details>
          </section>
          <aside className="intro-note">
            <ShieldCheck size={27} />
            <h2>
              A source for every
              <br />
              supported claim.
            </h2>
            <p>
              The Proof Gate checks each legal statement against an approved
              official passage. If it cannot support the claim, it blocks it.
            </p>
            <div className="privacy-note">
              <strong>Your document, your control.</strong>
              <p>
                Processed for this request. Not saved to a database or sent to
                an AI provider. Downloads remain on your device.
              </p>
            </div>
          </aside>
        </div>
        {busy && (
          <section role="status" className="processing">
            <LoaderCircle className="spin" />
            <h2>Reading, matching, checking.</h2>
            <p>Extracting text and checking approved source passages…</p>
          </section>
        )}
        {error && (
          <div role="alert" className="alert">
            <strong>Let’s try that again.</strong>
            <p>{error}</p>
            <Button variant="outline" onClick={() => setError("")}>
              Dismiss
            </Button>
          </div>
        )}
        {!analysis && !busy && (
          <section className="empty">
            <div className="empty-line" />
            <FileText size={32} />
            <h2>
              From a confusing notice
              <br />
              to a clearer next step.
            </h2>
            <p>
              Your document overview, source evidence, and action plan will
              appear here.
            </p>
            <span>Upload → Understand → Verify → Act</span>
          </section>
        )}
        {analysis && (
          <div className="results" key={analysis.id}>
            <div className="result-toolbar">
              <span>
                {analysis.synthetic
                  ? "SYNTHETIC DEMONSTRATION"
                  : "YOUR DOCUMENT"}{" "}
                · {analysis.provider}
              </span>
              <Button
                variant="ghost"
                onClick={() => {
                  setAnalysis(null);
                  setDraft("");
                  setPaste("");
                  setChecked([]);
                }}
              >
                <X size={15} /> Clear session
              </Button>
            </div>
            <div className="analysis-grid">
              <section className="panel notice">
                <div className="section-heading">
                  <span className="step-number">02</span>
                  <h2>What happened</h2>
                  <span className="status">Analysis complete</span>
                </div>
                <h3 className="notice-title">{analysis.noticeType}</h3>
                <p className="summary">{analysis.summary}</p>
                <div className="date-callout">
                  <span>When the notice asks you to act</span>
                  <strong>
                    {analysis.facts.find(
                      (f) =>
                        f.label.startsWith("Document-stated date") &&
                        /(?:by|before|no later|respond)/i.test(f.value),
                    )?.value || "No explicit action date extracted"}
                  </strong>
                  <small>
                    Document-stated, unconfirmed. This is not a calculated legal
                    deadline.
                  </small>
                </div>
                <h4>What the document says</h4>
                <div className="facts">
                  {analysis.facts.map((f, i) => (
                    <details key={i}>
                      <summary>
                        <span>{f.label}</span>
                        <strong>{f.value}</strong>
                      </summary>
                      <blockquote>{f.passage}</blockquote>
                    </details>
                  ))}
                </div>
                {!analysis.facts.length && (
                  <p>No structured facts found. Review the extracted text.</p>
                )}
                <details className="original">
                  <summary>Read extracted document</summary>
                  <small>{analysis.extractionMethod}</small>
                  <pre>{analysis.text}</pre>
                </details>
                <div className="review-note">
                  <strong>Check before you act</strong>
                  {analysis.warnings.map((w) => (
                    <p key={w}>{w}</p>
                  ))}
                </div>
              </section>
              <Evidence claims={analysis.claims} />
            </div>
            <Safety analysis={analysis} />
            <Provenance analysis={analysis} />
            <section id="actions" className="panel action-panel">
              <div className="section-heading">
                <span className="step-number">04</span>
                <h2>Your next steps</h2>
                <span className="muted">
                  {checked.length} of {analysis.actions.length} complete
                </span>
              </div>
              <div className="action-grid">
                <div>
                  <p className="muted">
                    An organization checklist, not a legal strategy.
                  </p>
                  <ol className="timeline">
                    {analysis.actions.map((a, i) => (
                      <li key={a}>
                        <label>
                          <input
                            type="checkbox"
                            checked={checked.includes(i)}
                            onChange={() =>
                              setChecked((p) =>
                                p.includes(i)
                                  ? p.filter((n) => n !== i)
                                  : [...p, i],
                              )
                            }
                          />
                          <span>{a}</span>
                        </label>
                      </li>
                    ))}
                  </ol>
                  <div className="export-actions">
                    <Button
                      variant="outline"
                      onClick={() => void exportPacket(true)}
                    >
                      Download privacy-safe packet <ArrowUpRight size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => void exportPacket(false)}
                    >
                      Download full packet
                    </Button>
                  </div>
                  <div className="privacy-review">
                    <strong>Privacy review</strong>
                    <p>
                      {analysis.privacyFindings.length
                        ? `Potential personal data detected: ${analysis.privacyFindings.join(", ")}.`
                        : "No common personal-data patterns detected."}
                    </p>
                    <p>
                      The privacy-safe export redacts common names, addresses,
                      email, phone, and identifier patterns. Review it before
                      sharing.
                    </p>
                  </div>
                  <p className="fine">
                    Both JSON packets include source snapshots, audit trail,
                    policy version, integrity digests, claims, dates, your
                    edited draft, and checklist.
                  </p>
                </div>
                <div className="draft">
                  <label htmlFor="draft">
                    <h3>An informational response</h3>
                  </label>
                  <p className="muted">
                    Review and edit. Nothing is sent automatically.
                  </p>
                  <textarea
                    id="draft"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <pre className="print-draft">{draft}</pre>
                </div>
              </div>
            </section>
          </div>
        )}
        <footer>
          <ShieldCheck size={19} />
          <p>
            <strong>Informational assistance only.</strong> {disclaimer}
          </p>
        </footer>
      </main>
    </div>
  );
}
