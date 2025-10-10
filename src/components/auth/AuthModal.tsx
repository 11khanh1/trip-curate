import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ForgotPasswordForm from "./ForgotForm";
import { motion, AnimatePresence } from "framer-motion";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register" | "forgot";
}

const AuthModal = ({
  isOpen,
  onClose,
  defaultMode = "login",
}: AuthModalProps) => {
  const [mode, setMode] = useState<"login" | "register" | "forgot">(defaultMode);

  // 🔄 Khi mở modal, reset lại đúng chế độ mặc định (login / register / forgot)
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
    }
  }, [isOpen, defaultMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-orange-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-orange-50 to-white">
  
          <div className="w-5 h-5" /> 

          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {mode === "login"
              ? "Đăng nhập"
              : mode === "register"
              ? "Đăng ký tài khoản" 
              : "Khôi phục mật khẩu"}
          </h2>
          
          {/* Nút đóng */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 sm:px-8">
          <AnimatePresence mode="wait">
            {mode === "login" && (
              <motion.div
                key="login"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <LoginForm
                  onSwitchToRegister={() => setMode("register")}
                  onForgotPassword={() => setMode("forgot")}
                  onSuccess={onClose}
                />
              </motion.div>
            )}

            {mode === "register" && (
              <motion.div
                key="register"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <RegisterForm
                  onSwitchToLogin={(email?: string) => {
                    setMode("login");
                    // nếu có email đã xác thực, truyền sang LoginForm (tùy chỉnh sau)
                    console.log("Email verified:", email);
                  }}
                  onSuccess={onClose}
                />
              </motion.div>
            )}

            {mode === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <ForgotPasswordForm onBackToLogin={() => setMode("login")} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal;
