import { useEffect, useRef, useState } from "react";
import { Mail, Phone, ShieldCheck, Facebook as FacebookIcon, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient, ensureCsrfToken, persistAuthToken } from "@/lib/api-client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  onSuccess: () => void;
}

interface LoginResponse {
  access_token?: string;
  token?: string;
  user?: any;
  message?: string;
  status?: string;
}

interface SocialRedirectResponse {
  url?: string;
}

const LoginForm = ({ onSwitchToRegister, onForgotPassword, onSuccess }: LoginFormProps) => {
  const { setCurrentUser } = useUser();
  const navigate = useNavigate();
  const [step, setStep] = useState<"choose" | "email" | "verify" | "account">("choose");
  const [formData, setFormData] = useState<{ email: string; otp: string; otpId: string | null; password: string }>({
    email: "",
    otp: "",
    otpId: null,
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [resending, setResending] = useState(false);
  const timerRef = useRef<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const isProd = import.meta.env.MODE === "production";
  const BASE_URL = isProd
    ? import.meta.env.VITE_API_BASE_URL_PROD
    : import.meta.env.VITE_API_BASE_URL;

  const handleChange = (field: "email" | "otp" | "password", value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const openSocialPopup = async (provider: "google" | "facebook") => {
    try {
      await ensureCsrfToken();
      const response = await apiClient.get<SocialRedirectResponse>(`/auth/social/${provider}/redirect`);
      const data = response.data ?? {};
      const url = data.url || `${BASE_URL}/auth/social/${provider}/redirect`;
      const popup = window.open(url, `oauth-${provider}` , "width=520,height=600,menubar=no,location=no,status=no");
      if (!popup) {
        // Popup bị chặn → redirect toàn trang
        window.location.href = url;
        return;
      }

      const onMessage = async (e: MessageEvent) => {
        if (!e.data || e.data.type !== "oauth-success") return;
        try {
          const token = e.data.token as string;
          persistAuthToken(token);
          // Cố gắng lấy user info (tùy backend)
          const me = await apiClient.get("/user", {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => null);
          if (me && me.status === 200) {
            const user = me.data;
            localStorage.setItem("user", JSON.stringify(user));
            setCurrentUser(user);
          }
          alert("Đăng nhập thành công!");
          onSuccess();
          navigate("/");
        } finally {
          window.removeEventListener("message", onMessage);
          popup.close();
        }
      };
      window.addEventListener("message", onMessage);
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          window.removeEventListener("message", onMessage);
        }
      }, 400);
    } catch (err) {
      alert("Không thể bắt đầu đăng nhập mạng xã hội.");
    }
  };

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(formData.email)) {
      alert("Vui lòng nhập email hợp lệ");
      return;
    }
    setLoading(true);
    try {
      await ensureCsrfToken();
      const { data } = await apiClient.post<{ otp_id?: string; message?: string }>("/auth/send-otp", {
        channel: "email",
        value: formData.email.trim(),
      });
      if (data?.otp_id) {
      setFormData((prev) => ({ ...prev, otpId: data.otp_id }));
    }
    alert("Đã gửi mã OTP tới email của bạn.");
    setStep("verify");
    setFormData((prev) => ({ ...prev, otp: "" }));
      startResendCountdown();
    } catch (error) {
      const response = (error as any)?.response;
      const message =
        response?.data?.message ??
        (error instanceof Error ? error.message : "Không thể gửi mã OTP. Vui lòng thử lại.");
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.otp || formData.otp.length < 4) {
      alert("Vui lòng nhập mã OTP hợp lệ.");
      return;
    }
    setLoading(true);
    try {
      await ensureCsrfToken();
      const payload: Record<string, unknown> = {
        channel: "email",
        value: formData.email.trim(),
        otp: formData.otp,
      };
      if (formData.otpId) payload.otp_id = formData.otpId;

      const { data } = await apiClient.post<LoginResponse>("/auth/verify-otp", payload);
      if (!data) throw new Error("Mã xác minh không đúng hoặc đã hết hạn.");

      if (data?.status === "need_password") {
        alert("Tài khoản chưa hoàn tất. Vui lòng thiết lập mật khẩu trước khi đăng nhập.");
        onSwitchToRegister();
        return;
      }

      const token = data.access_token ?? data.token;
      if (token) {
        persistAuthToken(token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setCurrentUser(data.user);
      }
      alert("Đăng nhập thành công!");
      onSuccess();
      navigate("/");
    } catch (error) {
      const response = (error as any)?.response;
      const message =
        response?.data?.message ?? (error instanceof Error ? error.message : "Xác thực thất bại.");
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      alert("Vui lòng nhập email và mật khẩu.");
      return;
    }
    setLoading(true);
    try {
      await ensureCsrfToken();
      const { data } = await apiClient.post<LoginResponse>("/login", {
        email: formData.email.trim(),
        password: formData.password,
      });

      if (!data) throw new Error("Đăng nhập thất bại.");

      const token = data.access_token ?? data.token;
      if (token) {
        persistAuthToken(token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setCurrentUser(data.user);
      }
      alert("Đăng nhập thành công!");
      onSuccess();
      navigate("/");
    } catch (error) {
      const response = (error as any)?.response;
      if (response?.status === 419) {
        alert("Phiên đã hết hạn. Vui lòng tải lại trang và thử lại.");
      } else {
        const message =
          response?.data?.message ?? (error instanceof Error ? error.message : "Đăng nhập thất bại.");
        alert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendIn > 0 || resending) return;
    if (!isValidEmail(formData.email)) {
      alert("Vui lòng nhập email hợp lệ");
      return;
    }
    try {
      setResending(true);
      await ensureCsrfToken();
      const { data } = await apiClient.post<{ otp_id?: string; message?: string }>("/auth/send-otp", {
        channel: "email",
        value: formData.email.trim(),
      });
      if (data?.otp_id) {
        setFormData((prev) => ({ ...prev, otpId: data.otp_id }));
      }
      alert("Đã gửi lại mã OTP.");
      startResendCountdown();
    } catch (error) {
      const response = (error as any)?.response;
      if (response?.status === 419) {
        alert("Phiên đã hết hạn. Vui lòng tải lại trang và thử lại.");
        return;
      }
      const message =
        response?.data?.message ??
        (error instanceof Error ? error.message : "Không thể gửi lại mã OTP.");
      alert(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-5">
      <AnimatePresence mode="wait">
        {step === "choose" && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="text-center space-y-4"
          >
            <div className="flex flex-col gap-3 mt-2">
              <Button
                variant="outline"
                className="h-11 font-medium justify-start pl-4"
                onClick={() => openSocialPopup("google")}
              >
                <img
                  src="https://www.svgrepo.com/show/355037/google.svg"
                  alt="google"
                  className="w-5 h-5 mr-2"
                />
                Google
              </Button>
              <Button
                className="relative h-11 font-medium justify-center bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg shadow"
                onClick={() => openSocialPopup("facebook")}
              >
                <FacebookIcon className="absolute left-4 w-5 h-5 text-white" />
                Facebook
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
                onClick={() => setStep("email")}
              >
                <Mail className="w-5 h-5 mr-2" /> Email
              </Button>
              <Button
                variant="outline"
                className="h-11 font-medium justify-start pl-4"
                onClick={() => setStep("account")}
              >
                <Mail className="w-5 h-5 mr-2" /> Bằng tài khoản
              </Button>
              
            </div>
          </motion.div>
        )}

        {step === "email" && (
          <motion.form
            key="email"
            onSubmit={handleSendOtp}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div>
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@example.com"
                  className="pl-10"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <Button
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold rounded-lg shadow hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Đang gửi mã..." : "Gửi mã OTP"}
            </Button>

            <div className="text-sm text-center">
              <button
                type="button"
                className="text-gray-600 hover:underline"
                onClick={() => setStep("choose")}
              >
                ← Chọn phương thức khác
              </button>
            </div>

            <div className="text-right">
              <Button
                type="button"
                variant="link"
                className="text-orange-500 text-sm"
                onClick={onForgotPassword}
              >
                Quên mật khẩu?
              </Button>
            </div>

            <div className="text-center mt-3">
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{" "}
                <Button variant="link" className="text-orange-500 p-0" onClick={onSwitchToRegister}>
                  Đăng ký ngay
                </Button>
              </p>
            </div>
          </motion.form>
        )}

        {step === "verify" && (
          <motion.form
            key="verify"
            onSubmit={handleVerifyOtp}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className="text-center">
              <ShieldCheck className="w-8 h-8 mx-auto text-orange-500 mb-2" />
              <p className="text-sm text-gray-600">
                Mã xác thực đã gửi đến <b>{formData.email}</b>
              </p>
            </div>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={formData.otp}
                onChange={(val) => handleChange("otp", val)}
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
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold rounded-lg shadow hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Đang xác thực..." : "Xác minh & đăng nhập"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              <button
                type="button"
                className="text-orange-500 hover:underline disabled:opacity-60"
                onClick={handleResendOtp}
                disabled={resendIn > 0 || resending}
              >
                {resendIn > 0 ? `Gửi lại mã sau ${resendIn}s` : resending ? "Đang gửi..." : "Gửi lại mã"}
              </button>
            </div>

            <div className="text-center mt-3">
              <p className="text-sm text-gray-600">
                Sai email?{" "}
                <Button variant="link" className="text-orange-500 p-0" onClick={() => setStep("email")}>
                  Nhập lại
                </Button>
              </p>
            </div>
          </motion.form>
        )}

        {step === "account" && (
          <motion.form
            key="account"
            onSubmit={handleAccountLogin}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div>
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@example.com"
                  className="pl-10"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="text-right">
              <Button
                type="button"
                variant="link"
                className="text-orange-500 text-sm"
                onClick={onForgotPassword}
              >
                Quên mật khẩu?
              </Button>
            </div>

            <Button
              className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold rounded-lg shadow hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>

            <div className="text-sm text-center">
              <button
                type="button"
                className="text-gray-600 hover:underline"
                onClick={() => setStep("choose")}
              >
                ← Chọn phương thức khác
              </button>
            </div>

            <div className="text-center mt-3">
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{" "}
                <Button variant="link" className="text-orange-500 p-0" onClick={onSwitchToRegister}>
                  Đăng ký ngay
                </Button>
              </p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
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

export default LoginForm;
