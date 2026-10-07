# oHRiise

Nền tảng HRM role-aware dành cho doanh nghiệp Việt Nam. Repository hiện chứa demo tương tác chi tiết theo blueprint trong `oHRiise_Codex_Sol56_Master_System_Prompt.md` và lớp mở rộng trong `oHRiise_Bonus_Override_Prompt_Codex_Sol56.md`.

## Chạy local

```bash
npm install
npm run dev
```

Mở `http://localhost:3000` và đăng nhập bằng dữ liệu demo đã điền sẵn.

## Kiểm tra chất lượng

```bash
npm run lint
npm run build
```

## Các phase đã triển khai

- Next.js App Router, React, TypeScript và Tailwind CSS.
- Theme dark/light với Be Vietnam Pro được đóng gói local.
- Permission engine tập trung theo resource, action, scope, source và restriction.
- Chính sách độc lập cho trường dữ liệu nhạy cảm: visible, masked, hidden.
- 7 persona demo với navigation và khả năng khác nhau.
- Login demo, app shell responsive, sidebar role-aware có thể thu gọn và command palette.
- Logo oHRiise chính thức tại `public/brand/ohriise-logo.png`, dùng thống nhất ở màn đăng nhập, sidebar và mobile header.
- Deep-link theo `?module=...`, chuyển cảnh bằng Motion, loading skeleton, error boundary và trang 404.
- Employee Home dạng bento với check-in, lịch, số dư phép, quick action và toast.
- Access denied state không tải nội dung của module không có quyền.
- Effective access preview để quan sát nguồn quyền, scope và thời hạn delegation.
- Employee self-service chi tiết: hồ sơ, chấm công và điều chỉnh, WFH, Daily Report, nghỉ phép, chi phí, hợp đồng, phiếu lương và thông báo.
- Team Lead workspace: trạng thái đội ngũ, lịch đội ngũ, hộp thư phê duyệt có ngữ cảnh và WFH AI Evidence Review.
- HR workspace: hồ sơ nhân sự master-detail, onboarding theo bước, vòng đời hợp đồng, sơ đồ tổ chức, offboarding, giám sát chấm công, khóa timesheet, duyệt chi phí, đồng bộ MISA, báo cáo và AI CV Review có giải thích.
- Admin workspace: tổng quan hệ thống, chi nhánh/GPS, tài khoản, permission template, access review có phân tách nhiệm vụ, ủy quyền tạm thời, danh mục, email/DLP, cấu hình thông báo, tích hợp, audit log và AI governance.
- Các form nghiệp vụ có validation, loading/feedback, lịch sử và trạng thái cập nhật tại chỗ.
- Luồng demo liên thông: yêu cầu WFH/nghỉ phép/chi phí/điều chỉnh từ Employee đi vào Approval Inbox; quyết định của Team Lead phản hồi lại lịch sử; onboarding tạo tài khoản; thay đổi quyền đi qua access review và audit log.
- Email doanh nghiệp dùng chung cho mọi persona, có inbox, starred, sent, draft, compose, attachment, HR shared mailbox và handoff CV sang AI theo quyền.
- AI CV Intelligence là specialist app có navigation riêng, requisition, candidate queue, dossier có source evidence, compare, quyết định của con người, history và model notes.
- WFH Intelligence là specialist app có review queue, employee sessions, evidence timeline, low-confidence review, decision log và privacy/access audit.
- Employee WFH hiển thị rõ phạm vi giám sát, dữ liệu thu thập, retention, người có quyền truy cập và tóm tắt phiên của chính nhân viên.
- WFH Intelligence xuất hiện với mọi persona: nhân viên có self-scope cho phiên và privacy của mình; Team Lead có review console theo quan hệ đội ngũ.
- Module transition dùng asset theo ngữ nghĩa: fade nội dung, asset xuất hiện ở trung tâm, brand sweep xanh–cyan–lime và asset ổn định tại góc phải header; có `prefers-reduced-motion`.
- Đánh giá hiệu suất cá nhân có mục tiêu, tiến độ và self-review, dùng asset KPI tương ứng.

Toàn bộ dữ liệu và mutation hiện dùng mock state trong trình duyệt để phục vụ demo tương tác; chưa kết nối backend hoặc lưu trữ bền vững.

## Lưu ý tài sản

Logo chính thức được dùng trực tiếp và thống nhất tại `public/brand/ohriise-logo.png`.

Toàn bộ 16 PNG trong `oHRiise_16_assets` đã được đưa vào `public/assets/ohriise` với nguyên tên mapping và đều được tham chiếu trong UI. Mapping dùng chung nằm tại `lib/module-visuals.ts`: onboarding, hồ sơ, hợp đồng, tổ chức, chấm công, WFH, nghỉ phép, lịch làm việc, AI tuyển dụng, pipeline phỏng vấn, hiệu suất, báo cáo, phiếu lương, thông báo, RBAC và offboarding.

Asset chỉ đóng vai trò minh họa hero, loading hoặc empty state; không thay thế controls và thông tin nghiệp vụ.
