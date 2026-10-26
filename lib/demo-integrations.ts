// Browser-only demo registry. These are product capabilities, not live health checks.
export const demoIntegrations = [
  { id: "misa", name: "MISA AMIS", state: "Chưa triển khai", detail: "Chưa có API, credential hoặc job đồng bộ; chỉ có xuất CSV nội bộ." },
  { id: "ai-cv", name: "AI CV", state: "Chưa cấu hình", detail: "Pipeline tuyển dụng dùng dữ liệu HR nhập; không có kết quả phân tích AI thật." },
  { id: "ai-wfh", name: "AI WFH", state: "Chưa cấu hình", detail: "Minh chứng trong demo không được chấm tự động bởi engine production." },
  { id: "devices", name: "Thiết bị chấm công", state: "Mô phỏng", detail: "Bản ghi mẫu không phải tín hiệu thiết bị trực tiếp." },
] as const;
