import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Phone, Facebook as FacebookIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient, ensureCsrfToken, persistAuthToken } from "@/lib/api-client";

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
}

interface SocialRedirectResponse {
  url?: string;
}

const LoginForm = ({ onSwitchToRegister, onForgotPassword, onSuccess }: LoginFormProps) => {
  const { setCurrentUser } = useUser();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [step, setStep] = useState<"choose" | "form">("choose");
  const [showPassword, setShowPassword] = useState(false);
  const isProd = import.meta.env.MODE === "production";
  const BASE_URL = isProd
    ? import.meta.env.VITE_API_BASE_URL_PROD
    : import.meta.env.VITE_API_BASE_URL;

  const handleChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ensureCsrfToken();
      const { data } = await apiClient.post<LoginResponse>("/login", {
        email: formData.email.trim(),
        password: formData.password,
      });

      if (!data) throw new Error("Đăng nhập thất bại");

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
        return;
      }
      const message =
        response?.data?.message ??
        (error instanceof Error ? error.message : "Đăng nhập thất bại");
      alert(message || "Đăng nhập thất bại");
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
                onClick={() => setStep("form")}
              >
                <Mail className="w-5 h-5 mr-2" /> Email
              </Button>
              <Button
                variant="outline"
                className="h-11 font-medium justify-start pl-4"
                onClick={() => setStep("form")}
              >
                <Mail className="w-5 h-5 mr-2" /> Bằng tài khoản
              </Button>
              
            </div>
          </motion.div>
        )}

        {step === "form" && (
          <motion.form
            key="form"
            onSubmit={handleLogin}
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
                  onClick={() => setShowPassword(!showPassword)}
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

            <Button className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold rounded-lg shadow hover:opacity-90">
              Đăng nhập
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
