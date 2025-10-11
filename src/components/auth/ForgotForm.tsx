import { useState } from "react";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

const ForgotPasswordForm = ({ onBackToLogin }: ForgotPasswordFormProps) => {
  const [step, setStep] = useState<"email" | "verify" | "setPassword">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpId, setOtpId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  // Chiến lược đặt mật khẩu sau khi verify:
  // - "set": dùng /api/auth/set-password (cần otp_id)
  // - "reset": dùng /api/reset-password (không cần otp_id, phù hợp khi verify trả token)
  const [resetMode, setResetMode] = useState<"set" | "reset">("set");
  const [loading, setLoading] = useState(false);
  const isProd = import.meta.env.MODE === "production";
  const BASE_URL = isProd
    ? import.meta.env.VITE_API_BASE_URL_PROD
    : import.meta.env.VITE_API_BASE_URL;
  const { setCurrentUser } = useUser();

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v.trim());

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return alert("Email không hợp lệ");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ channel: "email", value: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Không thể gửi OTP");
      setOtpId(data?.otp_id ?? null);
      setStep("verify");
      alert("Mã OTP đã gửi đến email của bạn!");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return alert("Vui lòng nhập mã OTP");
    setLoading(true);
    try {
      const payload: any = { channel: "email", value: email.trim(), otp };
      if (otpId) payload.otp_id = otpId;
      const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "OTP không đúng hoặc đã hết hạn");

      // Nếu có token (tài khoản tồn tại), chuyển qua chế độ reset-password
      if (data?.access_token || data?.token) {
        setResetMode("reset");
      } else {
        setResetMode("set");
      }

      // Lưu otp_id nếu có để dùng cho set-password
      if (data?.otp_id) setOtpId(data.otp_id);

      // Chuyển sang bước nhập mật khẩu mới
      setPassword("");
      setPasswordConfirm("");
      setStep("setPassword");
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return alert("Thiếu mã OTP. Vui lòng xác minh lại.");
    if (password.length < 8) {
      alert("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }
    if (password !== passwordConfirm) {
      alert("Xác nhận mật khẩu không khớp");
      return;
    }

    try {
      let res: Response;
      let data: any;

      if (resetMode === "set") {
        if (!otpId) return alert("Thiếu OTP ID. Vui lòng xác minh OTP lại.");
        res = await fetch(`${BASE_URL}/api/auth/set-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            otp_id: otpId,
            channel: "email",
            value: email,
            otp,
            password,
            password_confirmation: passwordConfirm,
          }),
        });
        data = await res.json().catch(() => ({}));
      } else {
        // resetMode === "reset": dùng endpoint reset-password truyền thống
        res = await fetch(`${BASE_URL}/api/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            type: "email",
            value: email,
            otp,
            new_password: password,
            new_password_confirmation: passwordConfirm,
          }),
        });
        data = await res.json().catch(() => ({}));
      }
      if (!res.ok) {
        alert(data?.message || "Thiết lập mật khẩu thất bại");
        return;
      }
      // Nếu backend trả access_token + user thì lưu lại để đăng nhập luôn
      if (data?.access_token) {
        localStorage.setItem("token", data.access_token);
      }
      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      alert("Thiết lập mật khẩu thành công!");
      onBackToLogin();
    } catch (err) {
      alert("Lỗi kết nối. Vui lòng thử lại.");
    }
  };

  return (
    <div className="space-y-5">
      {step === "email" && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="text-center">
            <Mail className="w-8 h-8 mx-auto text-orange-500 mb-2" />
            <p className="text-sm text-gray-500">
              Nhập email để nhận mã OTP khôi phục mật khẩu.
            </p>
          </div>
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button disabled={loading} className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold rounded-lg shadow hover:opacity-90">
            {loading ? "Đang gửi..." : "Gửi mã OTP"}
          </Button>
        </form>
      )}

      {step === "verify" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <p className="text-sm text-gray-600 text-center">Mã đã gửi đến: <b>{email}</b></p>
          <Label>Mã OTP</Label>
          <Input
            type="text"
            placeholder="Nhập mã OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("email")}>← Sửa email</Button>
            <Button disabled={loading} className="flex-1 bg-gradient-to-r from-orange-500 to-orange-400 text-white">
              {loading ? "Đang xác minh..." : "Xác minh OTP"}
            </Button>
          </div>
        </form>
      )}

      {step === "setPassword" && (
        <form onSubmit={handleSetPassword} className="space-y-4">
          <Label>Mật khẩu</Label>
          <Input
            type="password"
            placeholder="Mật khẩu từ 8 ký tự"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Label>Xác nhận mật khẩu</Label>
          <Input
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
          />
          <Button disabled={loading} className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold rounded-lg shadow hover:opacity-90">
            {loading ? "Đang thiết lập..." : "Thiết lập mật khẩu"}
          </Button>
        </form>
      )}

      <div className="text-center pt-3">
        <Button
          variant="link"
          className="text-orange-500 text-sm p-0"
          onClick={onBackToLogin}
        >
          ← Quay lại đăng nhập
        </Button>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
