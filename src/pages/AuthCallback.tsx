import { useEffect } from "react";

const AuthCallback = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const provider = params.get("provider") || undefined;

    if (token) {
      try {
        localStorage.setItem("token", token);
      } catch {}
      try {
        window.opener?.postMessage({ type: "oauth-success", token, provider }, window.location.origin);
      } catch {
        // best-effort postMessage
        try { window.opener?.postMessage({ type: "oauth-success", token, provider }, "*"); } catch {}
      }
      setTimeout(() => window.close(), 800);
    }
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <h3>Đang xử lý đăng nhập...</h3>
        <p>Bạn có thể đóng cửa sổ này.</p>
      </div>
    </div>
  );
};

export default AuthCallback;

