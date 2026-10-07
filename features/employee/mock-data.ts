export const attendanceLogs = [
  { date: "07/10/2026", day: "Thứ Tư", checkIn: "08:42", checkOut: "--:--", total: "Đang làm", mode: "Văn phòng", status: "active" },
  { date: "06/10/2026", day: "Thứ Ba", checkIn: "08:28", checkOut: "17:38", total: "8h 10p", mode: "Văn phòng", status: "ontime" },
  { date: "05/10/2026", day: "Thứ Hai", checkIn: "09:07", checkOut: "17:46", total: "7h 39p", mode: "Văn phòng", status: "late" },
  { date: "02/10/2026", day: "Thứ Sáu", checkIn: "08:31", checkOut: "17:35", total: "8h 04p", mode: "WFH", status: "ontime" },
  { date: "01/10/2026", day: "Thứ Năm", checkIn: "08:35", checkOut: "17:42", total: "8h 07p", mode: "Văn phòng", status: "ontime" },
];

export const leaveHistory = [
  { id: "LV-2026-0184", type: "Nghỉ phép năm", range: "12/10/2026", duration: "1 ngày", status: "approved", approver: "Trần Minh Quân" },
  { id: "LV-2026-0162", type: "Nghỉ buổi sáng", range: "28/09/2026", duration: "0.5 ngày", status: "approved", approver: "Trần Minh Quân" },
  { id: "LV-2026-0128", type: "Nghỉ phép năm", range: "17–18/08/2026", duration: "2 ngày", status: "approved", approver: "Trần Minh Quân" },
];

export const expenseHistory = [
  { id: "EXP-2609-041", title: "Figma Professional · tháng 9", category: "Phần mềm", amount: 386000, submitted: "30/09/2026", status: "hr-review" },
  { id: "EXP-2608-026", title: "Notion AI · tháng 8", category: "Phần mềm", amount: 245000, submitted: "31/08/2026", status: "paid" },
  { id: "EXP-2607-019", title: "Cáp chuyển USB-C", category: "Thiết bị", amount: 420000, submitted: "22/07/2026", status: "rejected" },
];

export const notifications = [
  { id: 1, category: "Phê duyệt", title: "Đơn nghỉ phép đã được duyệt", message: "Trần Minh Quân đã duyệt ngày nghỉ 12/10/2026.", time: "08:12", unread: true, tone: "success" },
  { id: 2, category: "Hợp đồng", title: "Phụ lục hợp đồng sắp hết hạn", message: "Phụ lục làm việc hybrid sẽ hết hạn sau 21 ngày.", time: "Hôm qua", unread: true, tone: "warning" },
  { id: 3, category: "Chấm công", title: "Cần bổ sung giải trình", message: "Ngày 05/10 có check-in muộn 37 phút.", time: "05/10", unread: true, tone: "danger" },
  { id: 4, category: "Phiếu lương", title: "Phiếu lương tháng 09 đã sẵn sàng", message: "Dữ liệu được đồng bộ từ MISA AMIS lúc 09:02.", time: "01/10", unread: false, tone: "blue" },
];
