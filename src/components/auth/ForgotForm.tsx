import { useState } from "react";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

const ForgotPasswordForm = ({ onBackToLogin }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const isProd = import.meta.env.MODE === "production";
  const BASE_URL = isProd
    ? import.meta.env.VITE_API_BASE_URL_PROD
    : import.meta.env.VITE_API_BASE_URL;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${BASE_URL}/api/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "email", value: email }),
    });
    if (res.ok) {
      setOtpSent(true);
      alert("Mã OTP đã gửi đến email của bạn!");
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${BASE_URL}/api/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "email", value: email, otp, newPassword }),
    });
    if (res.ok) {
      alert("Đặt lại mật khẩu thành công!");
      onBackToLogin();
    }
  };

  return (
    <div className="space-y-5">
      {!otpSent ? (
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
          <Button className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold rounded-lg shadow hover:opacity-90">
            Gửi mã OTP
          </Button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <Label>Mã OTP</Label>
          <Input
            type="text"
            placeholder="Nhập mã OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <Label>Mật khẩu mới</Label>
          <Input
            type="password"
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Button className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold rounded-lg shadow hover:opacity-90">
            Đặt lại mật khẩu
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
