import { useEffect, useRef, useState } from "react";
import { Mail, Phone, User, ShieldCheck, Facebook as FacebookIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useUser } from "@/context/UserContext";

interface RegisterFormProps {
  onSwitchToLogin: (email?: string) => void;
  onSuccess?: () => void;
}

const RegisterForm = ({ onSwitchToLogin, onSuccess }: RegisterFormProps) => {
  const [step, setStep] = useState<"choose" | "verifyEmail" | "form" | "setPassword">("choose");
  const [formData, setFormData] = useState<{
    email: string;
    otp: string;
    otpId: string | null;
    password?: string;
    confirmPassword?: string;
  }>({
    email: "",
    otp: "",
    otpId: null,
    password: "",
    confirmPassword: "",
  });
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const timerRef = useRef<number | null>(null);
  const isProd = import.meta.env.MODE === "production";
  const BASE_URL = isProd
    ? import.meta.env.VITE_API_BASE_URL_PROD
    : import.meta.env.VITE_API_BASE_URL;
  const { setCurrentUser } = useUser() as any;

  // Gửi mã OTP
  const isValidEmail = (value: string) => {
    const email = value.trim();
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    return re.test(email);
  };

  const startResendCountdown = (seconds = 60) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setResendIn(seconds);
    timerRef.current = window.setInterval(() => {
      setResendIn((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = formData.email.trim();
    if (!isValidEmail(trimmed)) {
      setEmailError("Email không hợp lệ");
      return;
    }
    if (trimmed !== formData.email) {
      setFormData((prev) => ({ ...prev, email: trimmed }));
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "email", value: trimmed }),
      });
      if (!res.ok) throw new Error("Không thể gửi mã xác minh");
      const data = await res.json().catch(() => ({}));
      setFormData((prev) => ({ ...prev, otpId: data?.otp_id ?? null }));
      alert("Đã gửi mã xác minh tới email của bạn!");
      setStep("verifyEmail");
      startResendCountdown(60);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Xác minh OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(
          Object.assign(
            { channel: "email", value: formData.email, otp: formData.otp },
            formData.otpId ? { otp_id: formData.otpId } : {}
          )
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Mã xác minh không đúng hoặc đã hết hạn!");

      // Trường hợp đã có tài khoản: API trả về token + user -> đăng nhập ngay
      if (data?.access_token || data?.token) {
        const token = data.access_token || data.token;
        localStorage.setItem("token", token);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          setCurrentUser(data.user);
        }
        alert("Đăng nhập thành công!");
        if (onSuccess) onSuccess(); else onSwitchToLogin(formData.email);
        return;
      }

      // Trường hợp chưa có TK: status = need_password -> hiển thị form đặt mật khẩu
      if (data?.status === "need_password") {
        setFormData((prev) => ({ ...prev, otpId: data?.otp_id ?? prev.otpId }));
        setStep("setPassword");
        return;
      }

      // Mặc định chuyển sang đặt mật khẩu nếu có otp_id mà không có token
      if (data?.otp_id) setFormData((prev) => ({ ...prev, otpId: data.otp_id }));
      setStep("setPassword");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Đặt mật khẩu cho email vừa xác minh
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((formData.password || "").length < 8) return alert("Mật khẩu phải từ 8 ký tự");
    if (formData.password !== formData.confirmPassword) return alert("Xác nhận mật khẩu không khớp");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(
          Object.assign(
            {
              otp_id: formData.otpId,
              channel: "email",
              value: formData.email,
              otp: formData.otp,
              password: formData.password,
              password_confirmation: formData.confirmPassword,
            },
            {}
          )
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Thiết lập mật khẩu thất bại");

      const token = data.access_token || data.token;
      if (token) localStorage.setItem("token", token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setCurrentUser(data.user);
      }
      alert("Thiết lập mật khẩu thành công! Bạn đã được đăng nhập.");
      if (onSuccess) onSuccess(); else onSwitchToLogin(formData.email);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendIn > 0 || resending) return;
    setResending(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "email", value: formData.email }),
      });
      if (!res.ok) throw new Error("Không thể gửi lại mã xác minh");
      const data = await res.json().catch(() => ({}));
      setFormData((prev) => ({ ...prev, otpId: data?.otp_id ?? prev.otpId }));
      alert("Đã gửi lại mã xác minh!");
      startResendCountdown(60);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setResending(false);
    }
  };

  // render từng bước
  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {/* Bước 1: Chọn phương thức đăng ký */}
        {step === "choose" && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="text-center space-y-4"
          >
            
            <div className="flex flex-col gap-3 mt-6">
              <Button
                variant="outline"
                className="h-11 font-medium justify-start pl-4"
              >
                <img
                  src="https://www.svgrepo.com/show/355037/google.svg"
                  alt="google"
                  className="w-5 h-5 mr-2"
                />
                Google
              </Button>
              
              <Button
                variant="outline"
                className="h-11 font-medium justify-start pl-4"
              >
                <Phone className="w-5 h-5 mr-2" /> Số điện thoại
              </Button>
              <Button
                variant="outline"
                className="h-11 font-medium justify-start pl-4"
                onClick={() => setStep("form")}
              >
                <Mail className="w-5 h-5 mr-2" /> Email
              </Button>
              <Button
                className="relative h-11 font-medium justify-center bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg shadow"
              >
                <FacebookIcon className="absolute left-4 w-5 h-5 text-white" />
                Facebook
              </Button>
            </div>

          
          </motion.div>
        )}

        {/* Bước 2: Nhập email để gửi mã xác minh */}
        {step === "form" && (
          <motion.form
            key="form"
            onSubmit={handleSendOtp}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="Địa chỉ email"
              value={formData.email}
              onChange={(e) => {
                const v = e.target.value;
                setFormData({ ...formData, email: v });
                if (!v) {
                  setEmailError("Vui lòng nhập email");
                } else if (!isValidEmail(v)) {
                  setEmailError("Email không hợp lệ");
                } else {
                  setEmailError(null);
                }
              }}
              aria-invalid={!!emailError}
              className={emailError ? "border-red-500 focus-visible:ring-red-500" : undefined}
              required
            />
            {emailError && (
              <p className="text-xs text-red-600 mt-1">{emailError}</p>
            )}
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold rounded-lg"
              disabled={loading || !!emailError || !formData.email}
            >
              {loading ? "Đang gửi..." : "Gửi mã xác minh"}
            </Button>

            <div className="flex justify-between text-sm text-gray-600">
              <button
                type="button"
                className="hover:underline"
                onClick={() => setStep("choose")}
              >
                ← Quay lại
              </button>
              <button
                type="button"
                className="text-orange-500 hover:underline"
                onClick={() => onSwitchToLogin()}
              >
                Đăng nhập bằng mật khẩu
              </button>
            </div>
          </motion.form>
        )}

        {/* Bước 3: Nhập OTP xác thực email */}
        {step === "verifyEmail" && (
          <motion.form
            key="verify"
            onSubmit={handleVerifyOtp}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="text-center mb-2">
              <ShieldCheck className="w-8 h-8 mx-auto text-orange-500 mb-2" />
              <p className="text-sm text-gray-600">
                Mã xác minh đã gửi đến: <b>{formData.email}</b>
              </p>
            </div>
            <Label>Mã OTP</Label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={formData.otp}
                onChange={(val) => setFormData({ ...formData, otp: val })}
                containerClassName="gap-2"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold rounded-lg"
              disabled={loading}
            >
              {loading ? "Đang xác thực..." : "Xác minh"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              <button
                type="button"
                className="text-orange-500 hover:underline disabled:opacity-60"
                onClick={handleResendOtp}
                disabled={resendIn > 0 || resending}
              >
                {resendIn > 0 ? `Gửi lại mã sau ${resendIn}s` : resending ? "Đang gửi lại..." : "Gửi lại mã"}
              </button>
            </div>
          </motion.form>
        )}

        {/* Bước 4: Đặt mật khẩu nếu chưa có tài khoản */}
        {step === "setPassword" && (
          <motion.form
            key="setPassword"
            onSubmit={handleSetPassword}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="text-center mb-2">
              <ShieldCheck className="w-8 h-8 mx-auto text-orange-500 mb-2" />
              <p className="text-sm text-gray-600">Thiết lập mật khẩu cho <b>{formData.email}</b></p>
            </div>
            <Label>Mật khẩu</Label>
            <Input
              type="password"
              placeholder="Mật khẩu từ 8 ký tự"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <Label>Xác nhận mật khẩu</Label>
            <Input
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold rounded-lg"
              disabled={loading}
            >
              {loading ? "Đang thiết lập..." : "Thiết lập mật khẩu"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Điều khoản */}
      <p className="text-xs text-gray-500 text-center mt-6">
        Bằng cách đăng ký hoặc đăng nhập, bạn đã hiểu và đồng ý với{" "}
        <a href="#" className="text-orange-500 underline">
          Điều khoản Dịch vụ
        </a>{" "}
        và{" "}
        <a href="#" className="text-orange-500 underline">
          Chính sách Bảo mật
        </a>
        .
      </p>
    </div>
  );
};

export default RegisterForm;
