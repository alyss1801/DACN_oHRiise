/* eslint-disable @typescript-eslint/no-require-imports -- Pure contract transition test. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
Module._extensions[".ts"] = function loadTs(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename); };
const { effectiveContractStatus, recordPaperSignature, verifyPaperSignature } = require("../features/hr/contract-model.ts");

test("paper signature is evidence-backed and verification does not activate a future contract", () => {
  const draft = { id: "HD-1", employeeId: "OH-1", type: "Xác định thời hạn", startsAt: "2026-11-01", endsAt: "2027-10-31", status: "draft", document: "missing", ownerId: "OH-HR", version: 1, note: "Demo" };
  assert.equal(recordPaperSignature(draft, "short", "2026-10-20T09:00:00Z"), null);
  const signed = recordPaperSignature(draft, "Biên bản giấy BB-001", "2026-10-20T09:00:00Z");
  assert.equal(signed.document, "paper-signed");
  assert.equal(recordPaperSignature(signed, "Biên bản giấy BB-001", "2026-10-20T09:00:00Z"), null);
  const verified = verifyPaperSignature(signed, "HR Tổng", "Đối chiếu bản gốc BB-001", "2026-10-21T09:00:00Z", "2026-10-21");
  assert.equal(verified.status, "scheduled");
  assert.equal(effectiveContractStatus(verified, "2026-11-01"), "active");
  assert.equal(effectiveContractStatus(verified, "2027-11-01"), "expired");
  assert.equal(verifyPaperSignature(verified, "HR Tổng", "Đối chiếu bản gốc BB-001", "2026-10-21T09:00:00Z", "2026-10-21"), null);
});
