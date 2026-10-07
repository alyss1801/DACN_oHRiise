"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { BrandMark } from "./brand-mark";

const loginSchema = z.object({
  email: z.email("Email công ty chưa hợp lệ."),
  password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginScreen({ onSignIn }: { onSignIn: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [otp, setOtp] = useState("123456");
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "ha.nguyen@ohriise.vn", password: "demo1234" } });

  function submit() {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setMfaRequired(true);
    }, 450);
  }

  return (
    <main className="login-shell">
      <section className="login-story" aria-label="Giới thiệu oHRiise">
        <BrandMark />
        <div className="login-story-copy">
          <div className="eyebrow">THE PEOPLE OPERATING SYSTEM</div>
          <h1>
            Vận hành nhân sự.
            <br />
            <span>Rõ ràng hơn.</span>
          </h1>
          <p>
            Một không gian chung để nhân sự, quản lý và đội ngũ cùng ra quyết định — đúng quyền,
            đúng ngữ cảnh.
          </p>
        </div>
        <div className="login-signal-grid" aria-hidden="true">
          <div className="signal-card signal-card-main">
            <div className="signal-head"><span>Nhịp làm việc hôm nay</span><span className="live-dot" /></div>
            <div className="signal-bars">
              {[34, 52, 43, 68, 62, 84, 72, 91, 78, 96, 82, 88].map((height, index) => (
                <i key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
          <div className="signal-card signal-card-small">
            <span>Đang hoạt động</span>
            <strong>248</strong>
            <small>92% lực lượng</small>
          </div>
        </div>
        <p className="login-security"><ShieldCheck size={14} strokeWidth={1.5} /> Dữ liệu được bảo vệ theo quyền truy cập hiệu lực.</p>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-brand"><BrandMark /></div>
          <div className="eyebrow">{mfaRequired ? "XÁC THỰC ĐA YẾU TỐ" : "CHÀO MỪNG TRỞ LẠI"}</div>
          <h2>{mfaRequired ? "Xác nhận đăng nhập" : "Đăng nhập vào oHRiise"}</h2>
          <p className="login-subtitle">{mfaRequired ? "Nhập mã 6 số từ ứng dụng xác thực. Mã demo đã được điền sẵn." : "Tiếp tục với tài khoản doanh nghiệp của bạn."}</p>

          {!mfaRequired ? <form onSubmit={handleSubmit(submit)} className="login-form" noValidate>
            <label>
              <span>Email công ty</span>
              <div className="input-wrap">
                <Mail size={16} strokeWidth={1.5} />
                <input type="email" {...register("email")} aria-invalid={Boolean(errors.email)} aria-label="Email công ty" />
              </div>
              {errors.email && <small className="field-error">{errors.email.message}</small>}
            </label>
            <label>
              <span>Mật khẩu</span>
              <div className="input-wrap">
                <LockKeyhole size={16} strokeWidth={1.5} />
                <input type={showPassword ? "text" : "password"} {...register("password")} aria-invalid={Boolean(errors.password)} aria-label="Mật khẩu" />
                <button type="button" className="input-action" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                  {showPassword ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
              {errors.password && <small className="field-error">{errors.password.message}</small>}
            </label>
            <button type="button" className="forgot-link" onClick={() => setNotice("Liên kết đặt lại mật khẩu đã được gửi tới email công ty.")}>Quên mật khẩu?</button>
            <button className="primary-button login-button" type="submit" disabled={loading}>
              {loading ? "Đang xác thực..." : "Đăng nhập"}
              {!loading && <ArrowRight size={17} strokeWidth={1.5} />}
            </button>
          </form> : <form className="login-form" onSubmit={(event) => { event.preventDefault(); if (!/^\d{6}$/.test(otp)) { setNotice("Mã xác thực phải gồm đúng 6 chữ số."); return; } setLoading(true); window.setTimeout(onSignIn, 350); }}><label><span>Mã xác thực</span><div className="input-wrap otp-input"><ShieldCheck size={16} strokeWidth={1.5} /><input inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} aria-label="Mã xác thực 6 số" /></div></label><button className="primary-button login-button" type="submit" disabled={loading}>{loading ? "Đang xác nhận..." : "Xác nhận và tiếp tục"}<ArrowRight size={17} strokeWidth={1.5} /></button><button className="forgot-link" type="button" onClick={() => setMfaRequired(false)}>Quay lại đăng nhập</button></form>}

          {!mfaRequired && <><div className="divider"><span>hoặc</span></div>
          <button className="google-button" type="button" onClick={onSignIn}>
            <span className="google-g">G</span> Tiếp tục với Google Workspace
          </button></>}
          <p className="login-notice" aria-live="polite">{notice}</p>
          <p className="login-footnote">Bản demo nội bộ · Mọi hành động quan trọng đều được ghi nhận.</p>
        </div>
      </section>
    </main>
  );
}
