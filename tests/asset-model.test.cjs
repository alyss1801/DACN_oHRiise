/* eslint-disable @typescript-eslint/no-require-imports -- Load pure TypeScript model without adding a test dependency. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
Module._extensions[".ts"] = function loadTs(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename); };
const { applyAssetCommand, normalizeAssetHandovers } = require("../features/hr/asset-model.ts");
const at = "2026-10-24T09:00:00.000Z";
const fixture = () => ({ assets: [{ id: "IT-1", name: "Laptop", category: "Máy tính", serial: "SER-1", branch: "HCM-Q1", condition: "Mới", status: "available" }], assetHandovers: [], employees: [{ id: "OH-1", name: "Hà", branch: "HCM-Q1", status: "active" }, { id: "OH-2", name: "Vy", branch: "HCM-TD", status: "active" }] });
const issue = (version = 1) => ({ type: "issue", assetId: "IT-1", employeeId: "OH-1", actorId: "OH-HR", condition: "Tốt", accessories: "Sạc và túi", evidence: "Biên bản BB-001", at, expectedVersion: version });
function next(previous, result) { assert.equal(result.ok, true, result.error); return { ...previous, assets: result.assets, assetHandovers: result.assetHandovers }; }

test("issue requires receipt; same asset cannot be assigned twice", () => {
  const start = fixture();
  const reserved = next(start, applyAssetCommand(start, issue()));
  assert.equal(reserved.assets[0].status, "awaiting_receipt");
  assert.equal(reserved.assets[0].assignedAt, "2026-10-24");
  assert.equal(reserved.assetHandovers.length, 1);
  assert.equal(applyAssetCommand(reserved, issue()).ok, false);
  assert.equal(applyAssetCommand(reserved, { type: "acknowledge", assetId: "IT-1", employeeId: "OH-2", at, expectedVersion: 2 }).ok, false);
  const accepted = next(reserved, applyAssetCommand(reserved, { type: "acknowledge", assetId: "IT-1", employeeId: "OH-1", at, expectedVersion: 2 }));
  assert.equal(accepted.assets[0].status, "assigned");
  assert.equal(applyAssetCommand(accepted, { type: "acknowledge", assetId: "IT-1", employeeId: "OH-1", at, expectedVersion: 2 }).ok, false);
});

test("return requires request and evidence; retry does not close twice", () => {
  const start = fixture();
  const reserved = next(start, applyAssetCommand(start, issue()));
  const accepted = next(reserved, applyAssetCommand(reserved, { type: "acknowledge", assetId: "IT-1", employeeId: "OH-1", at, expectedVersion: 2 }));
  assert.equal(applyAssetCommand(accepted, { type: "complete-return", assetId: "IT-1", actorId: "OH-HR", condition: "Tốt", evidence: "Biên bản BB-002", at, expectedVersion: 3 }).ok, false);
  const waiting = next(accepted, applyAssetCommand(accepted, { type: "request-return", assetId: "IT-1", actorId: "OH-HR", reason: "Offboarding theo hồ sơ", at, expectedVersion: 3 }));
  const returned = next(waiting, applyAssetCommand(waiting, { type: "complete-return", assetId: "IT-1", actorId: "OH-HR", condition: "Tốt", evidence: "Biên bản BB-002", at, expectedVersion: 4 }));
  assert.equal(returned.assets[0].status, "available");
  assert.equal(returned.assets[0].holderId, undefined);
  assert.equal(returned.assetHandovers[0].returnEvidence, "Biên bản BB-002");
  assert.equal(applyAssetCommand(returned, { type: "complete-return", assetId: "IT-1", actorId: "OH-HR", condition: "Tốt", evidence: "Biên bản BB-002", at, expectedVersion: 4 }).ok, false);
});

test("transfer closes old handover and creates exactly one new pending receipt", () => {
  const start = fixture();
  const reserved = next(start, applyAssetCommand(start, issue()));
  const accepted = next(reserved, applyAssetCommand(reserved, { type: "acknowledge", assetId: "IT-1", employeeId: "OH-1", at, expectedVersion: 2 }));
  const moved = next(accepted, applyAssetCommand(accepted, { ...issue(3), type: "transfer", employeeId: "OH-2", evidence: "Biên bản chuyển giao" }));
  assert.equal(moved.assets[0].holderId, "OH-2");
  assert.equal(moved.assets[0].branch, "HCM-TD");
  assert.equal(moved.assetHandovers.filter((item) => !item.returnedAt).length, 1);
  assert.equal(moved.assetHandovers.find((item) => item.employeeId === "OH-1").returnedAt, at);
});

test("legacy holder receives explicitly labeled synthetic seed handover", () => {
  const legacy = [{ ...fixture().assets[0], holderId: "OH-1", assignedAt: "2024-03-04", status: "assigned" }];
  const migrated = normalizeAssetHandovers(legacy);
  assert.equal(migrated[0].source, "seed");
  assert.equal(migrated[0].employeeId, "OH-1");
});
