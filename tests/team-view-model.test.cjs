/* eslint-disable @typescript-eslint/no-require-imports -- Pure TypeScript domain tests without another runtime dependency. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const test = require("node:test");
const ts = require("typescript");
Module._extensions[".ts"] = function loadTs(module, filename) { module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename); };
const { teamDay, isoWeek } = require("../features/team/team-view-model.ts");
const person = { id: "OH-1" };
const empty = { attendance: [], shiftAssignments: [], selfPunches: [], leave: [], requests: [], wfhSessions: [] };

test("weekly grid follows scenario date and keeps pending overlays separate", () => {
  assert.deepEqual(isoWeek("2026-10-20"), ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"]);
  const pending = { ...empty, requests: [{ type: "WFH", employeeId: person.id, date: "2026-10-20", status: "pending" }] };
  assert.equal(teamDay(person, "2026-10-20", pending).kind, "unscheduled");
  assert.deepEqual(teamDay(person, "2026-10-20", pending).pending, ["WFH chờ duyệt"]);
  assert.equal(teamDay(person, "2026-10-24", empty).kind, "off");
});

test("approved leave and WFH replace office plan; attendance remains an observation", () => {
  const office = { ...empty, attendance: [{ employeeId: person.id, date: "2026-10-20", shift: "Hành chính", plannedIn: "08:30", plannedOut: "17:30", events: [{ kind: "check-in", at: "08:31" }], issue: "late", resolution: "open" }] };
  assert.equal(teamDay(person, "2026-10-20", office).kind, "office");
  assert.equal(teamDay(person, "2026-10-20", office).issue, "late");
  const leave = { ...office, leave: [{ id: "LV-1", employeeId: person.id, from: "2026-10-20", to: "2026-10-20", portion: "full", status: "approved", type: "annual" }] };
  assert.equal(teamDay(person, "2026-10-20", leave).kind, "leave");
  assert.equal(teamDay(person, "2026-10-20", leave).leaveId, "LV-1");
  const wfh = { ...office, requests: [{ id: "WFH-1", type: "WFH", employeeId: person.id, date: "2026-10-20", status: "approved" }] };
  assert.equal(teamDay(person, "2026-10-20", wfh).kind, "wfh");
  assert.equal(teamDay(person, "2026-10-20", wfh).wfhId, "WFH-1");
});

test("published shift stays visible under a pending swap and updates after approval", () => {
  const assignment = { ...empty, shiftAssignments: [{ id: "SHIFT-1", employeeId: person.id, date: "2026-10-23", shift: "Hành chính", plannedIn: "08:30", plannedOut: "17:30" }] };
  const pending = { ...assignment, requests: [{ type: "Đổi ca", employeeId: person.id, date: "2026-10-23", status: "pending", shiftStart: "10:00", shiftEnd: "19:00", shiftAssignmentId: "SHIFT-1" }] };
  assert.match(teamDay(person, "2026-10-23", pending).detail, /08:30/);
  assert.deepEqual(teamDay(person, "2026-10-23", pending).pending, ["Đổi ca chờ duyệt"]);
  const approved = { ...pending, requests: [{ ...pending.requests[0], status: "approved" }] };
  assert.match(teamDay(person, "2026-10-23", approved).detail, /10:00–19:00/);
});
