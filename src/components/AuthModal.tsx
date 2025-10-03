import { X, Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/context/UserContext";
import { useState, useEffect } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register"
}



const AuthModal = ({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) => {
  // ✅ khởi tạo theo defaultMode
  const [isLogin, setIsLogin] = useState(defaultMode === "login");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    confirmPassword: ""
  });

  const { setCurrentUser } = useUser();

 
  useEffect(() => {
    if (isOpen) {
      setIsLogin(defaultMode === "login");
    }
  }, [isOpen, defaultMode]);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // === API LOGIN ===
        const res = await fetch("https://travel-backend-ua5x.onrender.com/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await res.json();
        console.log("Login response:", data); 

        if (!res.ok) {
          alert(data.message || "Đăng nhập thất bại");
          return;
        }

        // Đăng nhập thành công:
        if ((data.access_token || data.token) && data.user) {
          // lấy token đúng key từ backend
          const token = data.access_token || data.token;

          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(data.user));

          setCurrentUser(data.user);
          alert("Đăng nhập thành công!");
          onClose();
        } else {
          alert("Dữ liệu đăng nhập không hợp lệ từ server.");
        }



      } else {
        // Validate confirmPassword trước khi gọi API
        if (formData.password !== formData.confirmPassword) {
          alert("Mật khẩu và xác nhận mật khẩu không khớp");
          return;
        }

        // === API REGISTER ===
        const res = await fetch("https://travel-backend-ua5x.onrender.com/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,      // dùng name thay cho fullName
            phone: formData.phone,
            email: formData.email,
            password: formData.password,
            role: "user",
          }),
        });

        const data = await res.json();
        console.log("Register response:", data); 

        if (!res.ok) {
          alert(data.message || "Đăng ký thất bại");
          return;
        }

        alert("Đăng ký thành công! Bạn có thể đăng nhập.");
        setIsLogin(true);
      }
    } catch (err) {
      console.error("Auth error:", err);
      alert("Có lỗi xảy ra, vui lòng thử lại sau.");
    }
  };


  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="relative flex items-center justify-center p-6 border-b">
          <h2 className="text-2xl font-bold text-foreground">
            {isLogin ? "Đăng nhập" : "Đăng ký"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-6">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Social Login */}
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nhập họ và tên"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="email">
                  {isLogin ? "Tài khoản" : "Email"}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type={isLogin ? "text" : "email"} 
                    placeholder={
                      isLogin ? "Nhập email hoặc số điện thoại" : "Nhập địa chỉ email"
                    }
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {isLogin && (
              <div className="text-right">
                <Button variant="link" className="p-0 h-auto text-sm text-primary">
                  Quên mật khẩu?
                </Button>
              </div>
            )}

            <Button type="submit" className="w-full h-12 gradient-orange text-white font-semibold mb-6">
              {isLogin ? "Đăng nhập" : "Đăng ký"}
            </Button>
          </form>

          <div className="relative mb-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-muted-foreground">
              hoặc
            </span>
          </div>

          <div className="space-y-3 mb-6">
            <Button 
              variant="outline" 
              className="w-full h-12 text-sm font-medium"
              onClick={handleSubmit}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Tiếp tục với Google
            </Button>
          </div>
          {/* Toggle */}
          <div className="text-center mt-6">
            <span className="text-sm text-muted-foreground">
              {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            </span>
            <Button
              variant="link"
              className="p-0 h-auto text-sm font-semibold text-primary"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
            </Button>
          </div>

          {/* Terms */}
          {!isLogin && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Bằng cách đăng ký, bạn đồng ý với{" "}
              <a href="#" className="text-primary underline">Điều khoản dịch vụ</a>
              {" "}và{" "}
              <a href="#" className="text-primary underline">Chính sách bảo mật</a>
              {" "}của chúng tôi.
            </p>
          )}

          
        </div>
      </div>
    </div>
  );
};

export default AuthModal;