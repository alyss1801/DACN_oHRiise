export type HrEmployee = {
  id: string; name: string; initials: string; email: string; branch: string; department: string;
  position: string; managerId?: string; employmentType: string; startDate: string;
  status: "active" | "probation" | "inactive"; phone: string; address: string;
};
export type HrContract = {
  id: string; employeeId: string; type: string; startsAt: string; endsAt: string;
  status: "draft" | "active" | "expired"; document: "missing" | "paper-signed" | "verified";
  ownerId: string; version: number; note: string;
};
export type HrAsset = {
  id: string; name: string; category: string; serial: string; branch: string;
  holderId?: string; assignedAt?: string; condition: string; status: "available" | "assigned" | "maintenance";
};
export type AttendanceEvent = { kind: "check-in" | "check-out"; at: string; method: "GPS" | "QR" | "WFH"; note?: string };
export type HrAttendance = {
  id: string; employeeId: string; date: string; shift: string; plannedIn: string; plannedOut: string;
  events: AttendanceEvent[]; issue: "none" | "late" | "missing-in" | "missing-out" | "outside-gps" | "duplicate" | "shift-mismatch";
  resolution: "open" | "explanation" | "approved" | "rejected";
  correctionIn?: string; correctionOut?: string; reason?: string;
};
export type HrActivity = { id: string; at: string; employeeId?: string; branch: string; department: string; actor: string; text: string };
export type TimesheetPeriod = { id: string; status: "reconciling" | "closed" | "exported"; closedAt?: string; closedBy?: string; reopenReason?: string };
export type HrExport = { id: string; period: string; branch: string; at: string; count: number; status: "partial-demo" | "exported"; errors: number };
export type HrTask = { id: string; label: string; owner: string; deadline: string; doneAt?: string; note?: string };
export type HrCase = { id: string; employeeId: string; kind: "onboarding" | "offboarding"; startedAt: string; lastWorkingDay?: string; tasks: HrTask[]; completedAt?: string };
export type HrPolicy = { id: string; group: string; name: string; value: string; scope: string; effectiveAt: string; version: number; status: "draft" | "active" | "retired"; updatedAt: string };
export type HrRequisition = { id: string; title: string; department: string; branch: string; status: "open" | "closed"; createdAt: string; criteria: string };
export type HrCandidate = { id: string; name: string; email: string; requisitionId: string; experience: string; skills: string; cvSummary: string; stage: "new" | "screening" | "interview" | "assessment" | "offer" | "hired" | "rejected"; note: string; updatedAt: string; employeeId?: string };
export type HrState = {
  employees: HrEmployee[]; contracts: HrContract[]; assets: HrAsset[]; attendance: HrAttendance[];
  activities: HrActivity[]; periods: TimesheetPeriod[]; exports: HrExport[];
  leaveAdjustments: Record<string, number>; cases: HrCase[]; policies: HrPolicy[]; requisitions: HrRequisition[]; candidates: HrCandidate[];
};

export const initialHrState: HrState = {
  employees: [
    { id: "OH-0091", name: "Nguyễn Thanh Lan", initials: "NL", email: "lan.nguyen@ohriise.vn", branch: "HCM-Q1", department: "Nhân sự", position: "HR Operations Lead", employmentType: "Toàn thời gian", startDate: "2022-03-04", status: "active", phone: "090 000 0091", address: "TP. Hồ Chí Minh" },
    { id: "OH-0184", name: "Trần Minh Quân", initials: "TQ", email: "quan.tran@ohriise.vn", branch: "HCM-Q1", department: "Sản phẩm", position: "Head of Product", employmentType: "Toàn thời gian", startDate: "2023-02-12", status: "active", phone: "090 000 0184", address: "TP. Hồ Chí Minh" },
    { id: "OH-0248", name: "Nguyễn Thu Hà", initials: "NH", email: "ha.nguyen@ohriise.vn", branch: "HCM-Q1", department: "Sản phẩm", position: "Product Designer", managerId: "OH-0184", employmentType: "Toàn thời gian", startDate: "2024-03-04", status: "active", phone: "090 000 0248", address: "TP. Hồ Chí Minh" },
    { id: "OH-0259", name: "Bùi Thanh Tâm", initials: "BT", email: "tam.bui@ohriise.vn", branch: "HCM-TD", department: "Công nghệ thông tin", position: "Data Engineer", employmentType: "Toàn thời gian", startDate: "2024-07-08", status: "active", phone: "090 000 0259", address: "TP. Hồ Chí Minh" },
    { id: "OH-0271", name: "Lê Hoàng Vy", initials: "LV", email: "vy.le@ohriise.vn", branch: "HCM-TD", department: "Công nghệ thông tin", position: "Data Analyst", managerId: "OH-0259", employmentType: "Toàn thời gian", startDate: "2025-05-20", status: "active", phone: "090 000 0271", address: "TP. Hồ Chí Minh" },
    { id: "OH-0266", name: "Võ Thu Linh", initials: "TL", email: "linh.vo@ohriise.vn", branch: "HCM-Q1", department: "Nhân sự", position: "HR Generalist", managerId: "OH-0091", employmentType: "Toàn thời gian", startDate: "2025-01-13", status: "active", phone: "090 000 0266", address: "TP. Hồ Chí Minh" },
    { id: "OH-0204", name: "Lê Hoàng Đức", initials: "LĐ", email: "duc.le@ohriise.vn", branch: "HN-CG", department: "Kinh doanh", position: "Sales Executive", employmentType: "Toàn thời gian", startDate: "2023-11-06", status: "active", phone: "090 000 0204", address: "Hà Nội" },
    { id: "OH-0137", name: "Phạm Thanh Long", initials: "PL", email: "long.pham@ohriise.vn", branch: "HN-CG", department: "Kinh doanh", position: "Sales Executive", employmentType: "Toàn thời gian", startDate: "2022-08-01", status: "active", phone: "090 000 0137", address: "Hà Nội" },
    { id: "OH-0218", name: "Phạm Gia Bảo", initials: "GB", email: "bao.pham@ohriise.vn", branch: "HCM-TD", department: "Công nghệ thông tin", position: "Software Engineer", managerId: "OH-0259", employmentType: "Thử việc", startDate: "2026-10-01", status: "probation", phone: "090 000 0218", address: "TP. Hồ Chí Minh" },
  ],
  contracts: [
    { id: "HD-2026-091", employeeId: "OH-0248", type: "Xác định thời hạn", startsAt: "2025-11-06", endsAt: "2026-11-05", status: "active", document: "verified", ownerId: "OH-0091", version: 2, note: "Sắp đến hạn gia hạn." },
    { id: "HD-2026-092", employeeId: "OH-0184", type: "Không xác định thời hạn", startsAt: "2023-02-12", endsAt: "2030-12-31", status: "active", document: "verified", ownerId: "OH-0091", version: 1, note: "Bản giấy đã đối chiếu." },
    { id: "HD-2026-093", employeeId: "OH-0266", type: "Xác định thời hạn", startsAt: "2025-12-01", endsAt: "2026-11-30", status: "active", document: "paper-signed", ownerId: "OH-0091", version: 1, note: "Chờ HR xác minh bản giấy." },
    { id: "HD-2026-094", employeeId: "OH-0218", type: "Thử việc", startsAt: "2026-10-01", endsAt: "2026-11-30", status: "draft", document: "missing", ownerId: "OH-0091", version: 1, note: "Chờ bổ sung bản ký." },
    { id: "HD-2026-095", employeeId: "OH-0137", type: "Xác định thời hạn", startsAt: "2025-11-01", endsAt: "2026-10-31", status: "active", document: "verified", ownerId: "OH-0091", version: 1, note: "Đang chuẩn bị kết thúc quan hệ lao động." },
  ],
  assets: [
    { id: "IT-0238", name: "MacBook Pro 14-inch", category: "Máy tính", serial: "MBP-DEMO-238", branch: "HCM-Q1", holderId: "OH-0248", assignedAt: "2024-03-04", condition: "Tốt", status: "assigned" },
    { id: "IT-0191", name: "ThinkPad T14", category: "Máy tính", serial: "T14-DEMO-191", branch: "HCM-Q1", holderId: "OH-0184", assignedAt: "2023-02-12", condition: "Tốt", status: "assigned" },
    { id: "IT-0307", name: "Dell Latitude 7440", category: "Máy tính", serial: "DL-DEMO-307", branch: "HN-CG", holderId: "OH-0137", assignedAt: "2024-02-08", condition: "Cần kiểm tra", status: "assigned" },
    { id: "IT-0412", name: "MacBook Air M3", category: "Máy tính", serial: "MBA-DEMO-412", branch: "HCM-TD", condition: "Mới", status: "available" },
  ],
  attendance: seedAttendance(),
  activities: [
    { id: "act-1", at: "2026-10-20T09:15:00+07:00", employeeId: "OH-0266", branch: "HCM-Q1", department: "Nhân sự", actor: "Hệ thống demo", text: "Phát hiện check-in muộn của Võ Thu Linh." },
    { id: "act-2", at: "2026-10-19T15:30:00+07:00", employeeId: "OH-0248", branch: "HCM-Q1", department: "Sản phẩm", actor: "Nguyễn Thanh Lan", text: "Đánh dấu hợp đồng Nguyễn Thu Hà sắp đến hạn." },
  ],
  periods: [{ id: "2026-10", status: "reconciling" }, { id: "2026-09", status: "reconciling", reopenReason: "Đối soát 2 bản ghi lỗi sau lần xuất demo trước." }],
  exports: [{ id: "EXP-DEMO-091", period: "2026-09", branch: "Toàn công ty", at: "2026-10-03T09:02:00+07:00", count: 7, status: "partial-demo", errors: 2 }],
  leaveAdjustments: {},
  cases: [
    { id: "ON-2026-018", kind: "onboarding", employeeId: "OH-0218", startedAt: "2026-10-01", tasks: [
      { id: "profile", label: "Xác nhận hồ sơ và cơ cấu", owner: "HR", deadline: "2026-10-02", doneAt: "2026-10-01", note: "Hồ sơ thử việc đã tạo." },
      { id: "contract", label: "Xác minh hợp đồng", owner: "HR", deadline: "2026-10-22" },
      { id: "account", label: "Cấp tài khoản và quyền cơ bản", owner: "System Admin", deadline: "2026-10-22" },
      { id: "leave", label: "Thiết lập phép và ca làm", owner: "HR", deadline: "2026-10-23", doneAt: "2026-10-02", note: "Phép năm và ca hành chính demo." },
      { id: "asset", label: "Bàn giao tài sản", owner: "IT", deadline: "2026-10-24" },
    ] },
    { id: "OFF-2026-018", kind: "offboarding", employeeId: "OH-0137", startedAt: "2026-10-18", lastWorkingDay: "2026-10-31", tasks: [
      { id: "documents", label: "Xác nhận hồ sơ thôi việc", owner: "HR", deadline: "2026-10-22", doneAt: "2026-10-19", note: "Đơn đã được xác nhận." },
      { id: "handover", label: "Bàn giao công việc", owner: "Quản lý trực tiếp", deadline: "2026-10-27" },
      { id: "asset", label: "Thu hồi tài sản", owner: "IT", deadline: "2026-10-30" },
      { id: "account", label: "Phối hợp khóa tài khoản", owner: "System Admin", deadline: "2026-10-31" },
    ] },
  ],
  policies: [
    { id: "POL-ATT-01", group: "Chấm công", name: "Ngưỡng đi trễ (phút)", value: "15", scope: "Toàn công ty", effectiveAt: "2026-11-01", version: 2, status: "active", updatedAt: "2026-10-10" },
    { id: "POL-ATT-02", group: "Chấm công", name: "Phương thức hợp lệ", value: "QR, GPS, WFH", scope: "Toàn công ty", effectiveAt: "2026-11-01", version: 1, status: "active", updatedAt: "2026-10-10" },
    { id: "POL-LEAVE-01", group: "Nghỉ phép", name: "Phép năm được cấp", value: "12", scope: "Toàn công ty", effectiveAt: "2026-01-01", version: 1, status: "active", updatedAt: "2025-12-20" },
    { id: "POL-SHIFT-01", group: "Ca làm việc", name: "Ca hành chính", value: "08:30–17:30 · nghỉ 60 phút", scope: "Toàn công ty", effectiveAt: "2026-01-01", version: 1, status: "active", updatedAt: "2025-12-20" },
    { id: "POL-APPROVAL-01", group: "Phê duyệt", name: "Tuyến duyệt nghỉ phép", value: "Team Lead → HR", scope: "Toàn công ty", effectiveAt: "2026-01-01", version: 1, status: "active", updatedAt: "2025-12-20" },
    { id: "POL-WFH-01", group: "WFH", name: "Báo cáo cuối ngày", value: "Bắt buộc trước 18:00", scope: "Toàn công ty", effectiveAt: "2026-10-01", version: 1, status: "active", updatedAt: "2026-09-20" },
    { id: "POL-CONTRACT-01", group: "Hợp đồng", name: "Cảnh báo hết hạn", value: "30 ngày", scope: "Toàn công ty", effectiveAt: "2026-01-01", version: 1, status: "active", updatedAt: "2025-12-20" },
  ],
  requisitions: [
    { id: "REQ-2026-041", title: "Backend Engineer", department: "Công nghệ thông tin", branch: "HCM-TD", status: "open", createdAt: "2026-09-28", criteria: "TypeScript, Node.js, SQL; kinh nghiệm API và hệ thống sản phẩm" },
    { id: "REQ-2026-039", title: "Product Designer", department: "Sản phẩm", branch: "HCM-Q1", status: "open", createdAt: "2026-10-04", criteria: "Figma, nghiên cứu người dùng, thiết kế hệ thống" },
  ],
  candidates: [
    { id: "CV-001", name: "Nguyễn Văn An", email: "an@example.com", requisitionId: "REQ-2026-041", experience: "5 năm backend", skills: "TypeScript, Node.js, PostgreSQL", cvSummary: "Tóm tắt do HR nhập cho demo; chưa có tệp CV hoặc phân tích AI.", stage: "screening", note: "Cần xác minh dự án production trong phỏng vấn.", updatedAt: "2026-10-18" },
    { id: "CV-002", name: "Trần Minh Khoa", email: "khoa@example.com", requisitionId: "REQ-2026-041", experience: "4 năm backend", skills: "Java, Kafka, SQL", cvSummary: "Thông tin minh họa do HR nhập; chưa có tệp CV.", stage: "interview", note: "Đã đặt lịch phỏng vấn kỹ thuật bên ngoài demo.", updatedAt: "2026-10-19" },
    { id: "CV-003", name: "Mai Thu Trang", email: "trang@example.com", requisitionId: "REQ-2026-039", experience: "3 năm thiết kế sản phẩm", skills: "Figma, Design System, UX Research", cvSummary: "Thông tin minh họa do HR nhập; chưa có tệp CV.", stage: "new", note: "", updatedAt: "2026-10-20" },
  ],
};

function seedAttendance(): HrAttendance[] {
  const people = ["OH-0091", "OH-0184", "OH-0248", "OH-0259", "OH-0271", "OH-0266", "OH-0204", "OH-0218"];
  const rows: HrAttendance[] = [];
  for (let index = 1; index <= 50; index += 1) {
    const month = index <= 30 ? "09" : "10";
    const day = index <= 30 ? index : index - 30;
    const date = `2026-${month}-${String(day).padStart(2, "0")}`;
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    for (const employeeId of people) {
      if (employeeId === "OH-0218" && month === "09") continue; // Joined in October.
      if (employeeId === "OH-0271" && month === "10" && day === 20) continue; // Approved leave in the shared request store.
      const exception = month === "10" && day === 20 ? ({ "OH-0184": "missing-out", "OH-0218": "missing-in", "OH-0266": "late", "OH-0204": "outside-gps" } as Record<string, HrAttendance["issue"]>)[employeeId] : month === "09" && day === 30 && employeeId === "OH-0266" ? "missing-out" : month === "09" && day === 29 && employeeId === "OH-0248" ? "late" : undefined;
      const issue = exception ?? "none";
      const events: AttendanceEvent[] = issue === "missing-in" ? [{ kind: "check-out", at: "17:32", method: "QR" }] : [
        { kind: "check-in", at: issue === "late" ? "09:12" : "08:28", method: employeeId === "OH-0204" ? "GPS" : "QR", note: issue === "outside-gps" ? "Ngoài vùng cho phép · dữ liệu demo" : undefined },
        ...(issue === "missing-out" ? [] : [{ kind: "check-out" as const, at: "17:34", method: "QR" as const }]),
      ];
      rows.push({ id: `${employeeId}-${date}`, employeeId, date, shift: "Hành chính", plannedIn: "08:30", plannedOut: "17:30", events, issue, resolution: issue === "none" ? "approved" : "open" });
    }
  }
  return rows;
}

export const hrDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("vi-VN");
export const hrToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
