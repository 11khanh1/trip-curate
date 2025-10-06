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
  const [isLogin, setIsLogin] = useState(defaultMode === "login");
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
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
      setIsForgotPassword(false);
      setResetSent(false);
      setResetEmail("");
    }
  }, [isOpen, defaultMode]);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const res = await fetch("https://travel-backend-ua5x.onrender.com/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "email", value: resetEmail })
    });
    const data = await res.json();

    if (!res.ok) return alert(data.message || "Lỗi khi gửi OTP");
    alert("Mã OTP đã được gửi đến email của bạn!");
    setStep("otp");
  } catch (err) {
    console.error(err);
    alert("Lỗi mạng hoặc server.");
  }
};

const handleVerifyOtp = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const res = await fetch("https://travel-backend-ua5x.onrender.com/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "email", value: resetEmail , otp }),
    });
    const data = await res.json();

    if (!res.ok) return alert(data.message || "OTP không đúng hoặc hết hạn");
    alert("Xác thực OTP thành công! Hãy đặt lại mật khẩu mới.");
    setStep("reset");
  } catch (err) {
    console.error(err);
    alert("Lỗi khi xác thực OTP.");
  }
};

const handleResetPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  if (newPassword !== confirmNewPassword) {
    alert("Mật khẩu xác nhận không khớp!");
    return;
  }
  try {
    const res = await fetch("https://travel-backend-ua5x.onrender.com/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({  type: "email", value: resetEmail , newPassword }),
    });
    const data = await res.json();

    if (!res.ok) return alert(data.message || "Không thể đặt lại mật khẩu");
    alert("Đặt lại mật khẩu thành công! Hãy đăng nhập lại.");
    setIsForgotPassword(false);
    setStep("email");
  } catch (err) {
    console.error(err);
    alert("Lỗi khi đặt lại mật khẩu.");
  }
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
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

        if ((data.access_token || data.token) && data.user) {
          const token = data.access_token || data.token;

          localStorage.setItem("token", token);
          
          // Temporarily allow admin access for testing (INSECURE - use proper backend)
          const userWithRole = {
            ...data.user,
            role: data.user.role || (data.user.email === "admin@example.com" ? "admin" : "user")
          };
          
          localStorage.setItem("user", JSON.stringify(userWithRole));
          setCurrentUser(userWithRole);
          alert("Đăng nhập thành công!");
          onClose();
        } else {
          alert("Dữ liệu đăng nhập không hợp lệ từ server.");
        }

      } else {
        if (formData.password !== formData.confirmPassword) {
          alert("Mật khẩu và xác nhận mật khẩu không khớp");
          return;
        }

        const res = await fetch("https://travel-backend-ua5x.onrender.com/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
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
            {isForgotPassword ? "Quên mật khẩu" : isLogin ? "Đăng nhập" : "Đăng ký"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-6">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isForgotPassword ? (
            <div className="space-y-6">
              {step === "email" && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="text-center mb-4">
                    <Mail className="w-8 h-8 mx-auto text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nhập email để nhận mã OTP khôi phục mật khẩu.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="Nhập địa chỉ email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 gradient-orange text-white font-semibold">
                    Gửi mã OTP
                  </Button>
                </form>
              )}

              {step === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground">
                      Mã OTP đã được gửi đến email <strong>{resetEmail}</strong>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Mã OTP</Label>
                    <Input
                      type="text"
                      placeholder="Nhập mã OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 gradient-orange text-white font-semibold">
                    Xác thực OTP
                  </Button>
                </form>
              )}

              {step === "reset" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mật khẩu mới</Label>
                    <Input
                      type="password"
                      placeholder="Nhập mật khẩu mới"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Xác nhận mật khẩu</Label>
                    <Input
                      type="password"
                      placeholder="Nhập lại mật khẩu"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 gradient-orange text-white font-semibold">
                    Đặt lại mật khẩu
                  </Button>
                </form>
              )}

              <div className="text-center">
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-primary"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setStep("email");
                  }}
                >
                  ← Quay lại đăng nhập
                </Button>
              </div>
            </div>
          ) : (
            <>
          {/* Login/Register Form */}
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
                    <Button 
                      type="button"
                      variant="link" 
                      className="p-0 h-auto text-sm text-primary"
                      onClick={() => setIsForgotPassword(true)}
                    >
                      Quên mật khẩu?
                    </Button>
                  </div>
                )}

                <Button type="submit" className="w-full h-12 gradient-orange text-white font-semibold">
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
                <Button 
                  variant="outline" 
                  className="w-full h-12 text-sm font-medium"
                  onClick={handleSubmit}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path 
                      fill="#1877F2" 
                      d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.096 4.388 23.092 10.125 24v-8.437H7.078v-3.49h3.047V9.845c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.492 0-1.955.93-1.955 1.887v2.258h3.328l-.532 3.49h-2.796V24C19.612 23.092 24 18.096 24 12.073z"
                    />
                  </svg>
                  Tiếp tục với Facebook
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};


export default AuthModal;
