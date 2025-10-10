import { useState } from "react";
import { Mail, Phone, User, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface RegisterFormProps {
  onSwitchToLogin: (email?: string) => void;
  onSuccess?: () => void;
}

const RegisterForm = ({ onSwitchToLogin }: RegisterFormProps) => {
  const [step, setStep] = useState<"choose" | "verifyEmail" | "form">("choose");
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
  });
  const [loading, setLoading] = useState(false);
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Gửi mã OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email", value: formData.email }),
      });
      if (!res.ok) throw new Error("Không thể gửi mã xác minh");
      alert("Đã gửi mã xác minh tới email của bạn!");
      setStep("verifyEmail");
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
      const res = await fetch(`${BASE_URL}/api/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "email",
          value: formData.email,
          otp: formData.otp,
        }),
      });
      if (!res.ok) throw new Error("Mã xác minh không đúng hoặc đã hết hạn!");
      alert("Xác thực thành công!");
      onSwitchToLogin(formData.email); // chuyển sang đăng nhập với email đã xác thực
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
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
            </div>

            <Button
              variant="link"
              className="mt-3 text-sm text-gray-500 underline"
            >
              Lựa chọn khác
            </Button>
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
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold rounded-lg"
              disabled={loading}
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
            <Input
              type="text"
              placeholder="Nhập mã xác minh"
              value={formData.otp}
              onChange={(e) =>
                setFormData({ ...formData, otp: e.target.value })
              }
              required
            />
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold rounded-lg"
              disabled={loading}
            >
              {loading ? "Đang xác thực..." : "Xác minh"}
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
