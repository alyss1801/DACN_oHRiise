import type { HrContract } from "./hr-demo-data";

export function effectiveContractStatus(contract: HrContract, today: string): HrContract["status"] {
  if (contract.document !== "verified") return "draft";
  if (contract.endsAt && contract.endsAt < today) return "expired";
  return contract.startsAt > today ? "scheduled" : "active";
}

export function recordPaperSignature(contract: HrContract, evidence: string, at: string): HrContract | null {
  if (contract.document !== "missing" || evidence.trim().length < 8) return null;
  return { ...contract, document: "paper-signed", signedAt: at, signedEvidence: evidence.trim() };
}

export function verifyPaperSignature(contract: HrContract, actor: string, evidence: string, at: string, today: string): HrContract | null {
  if (contract.document !== "paper-signed" || !actor || evidence.trim().length < 8) return null;
  const next: HrContract = { ...contract, document: "verified", verifiedAt: at, verifiedBy: actor, verificationEvidence: evidence.trim(), signedEvidence: contract.signedEvidence ?? evidence.trim() };
  return { ...next, status: effectiveContractStatus(next, today) };
}
