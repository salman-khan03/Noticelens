import { ExternalLink, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { Claim } from '@/lib/contracts';
export function Evidence({claims}:{claims:Claim[]}) {
 return <section id="evidence" className="panel evidence"><div className="section-heading"><span className="step-number">03</span><h2>Why we think this</h2></div><p className="muted">General legal information. Case-specific applicability still needs review.</p>
 {!claims.length&&<p>No supported legal information found. Human review required.</p>}
 {claims.map(c=><details key={c.id} className={`claim ${c.verificationStatus==='VERIFIED'?'supported':'blocked'}`} open={c.verificationStatus!=='VERIFIED'}><summary><span className="claim-status">{c.verificationStatus==='VERIFIED'?<ShieldCheck size={17}/>:<ShieldAlert size={17}/>} {c.verificationStatus.replaceAll('_',' ')}</span><span className="claim-text">{c.claim}</span><span className="detail-hint">{c.category==='deliberate_safety_test'?'Deliberately injected demo claim':'View evidence and reasoning'}</span></summary><p>{c.reason}</p>{c.source&&<><a href={c.source.url} target="_blank" rel="noreferrer">{c.source.title} <ExternalLink size={13}/></a><blockquote>{c.supportingPassage}</blockquote><small>Retrieved {new Date(c.source.retrievedAt).toLocaleDateString('en-US')} · {c.source.jurisdiction} · Preserved snapshot</small><details className="provenance"><summary>Full source snapshot & integrity hash</summary><p>{c.source.passage}</p><code>{c.source.sha256}</code></details></>}</details>)}
 </section>
}
