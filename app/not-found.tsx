import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return <main className="fatal-state"><SearchX size={28} strokeWidth={1.5} /><h1>Không tìm thấy trang</h1><p>Đường dẫn này không thuộc không gian làm việc oHRiise hoặc đã được di chuyển.</p><Link className="primary-button" href="/"><ArrowLeft size={15} strokeWidth={1.5} /> Về trang đăng nhập</Link></main>;
}
