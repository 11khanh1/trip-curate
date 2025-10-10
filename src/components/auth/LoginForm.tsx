import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  onSuccess: () => void;
}

const LoginForm = ({ onSwitchToRegister, onForgotPassword, onSuccess }: LoginFormProps) => {
  const { setCurrentUser } = useUser();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const isProd = import.meta.env.MODE === "production";
  const BASE_URL = isProd
    ? import.meta.env.VITE_API_BASE_URL_PROD
    : import.meta.env.VITE_API_BASE_URL;


  const handleChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) return alert(data.message || "Đăng nhập thất bại");

      localStorage.setItem("token", data.access_token || data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setCurrentUser(data.user);
      alert("Đăng nhập thành công!");
      onSuccess();
      navigate("/");
    } catch {
      alert("Lỗi mạng hoặc server.");
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
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

      <div className="text-center mt-3">
        <p className="text-sm text-gray-600">
          Chưa có tài khoản?{" "}
          <Button variant="link" className="text-orange-500 p-0" onClick={onSwitchToRegister}>
            Đăng ký ngay
          </Button>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
