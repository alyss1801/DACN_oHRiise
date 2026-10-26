/* eslint-disable @typescript-eslint/no-require-imports -- Pure TypeScript model test. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
Module._extensions[".ts"] = function loadTs(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename); };
const { resignationInputError } = require("../features/hr/resignation-model.ts");

const employee = { id: "OH-0248", status: "active" };
const input = { employee, lastWorkingDay: "2026-10-31", reason: "Xin nghỉ để chuyển công tác", today: "2026-10-20", requests: [], cases: [] };

test("resignation validates the last working day and reason", () => {
  assert.equal(resignationInputError(input), null);
  assert.match(resignationInputError({ ...input, lastWorkingDay: "2026-02-30" }), /Ngày làm việc cuối/);
  assert.match(resignationInputError({ ...input, lastWorkingDay: "2026-10-19" }), /quá khứ/);
  assert.match(resignationInputError({ ...input, reason: "Nghỉ" }), /Lý do/);
  assert.match(resignationInputError({ ...input, employee: { ...employee, status: "inactive" } }), /hồ sơ nhân sự/);
});

test("resignation prevents duplicate requests and active offboarding", () => {
  const request = { id: "RES-1", type: "Nghỉ việc", employeeId: employee.id, status: "hr-review" };
  assert.match(resignationInputError({ ...input, requests: [request] }), /đơn xin nghỉ việc đang xử lý/);
  assert.match(resignationInputError({ ...input, cases: [{ id: "OFF-1", kind: "offboarding", employeeId: employee.id }] }), /quy trình nghỉ việc/);
  assert.equal(resignationInputError({ ...input, requests: [request], cases: [{ id: "OFF-1", kind: "offboarding", employeeId: employee.id, sourceReference: request.id, cancelledAt: "2026-10-21T08:00:00Z" }] }), null);
});
