import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import "./LoginPage.css";

export default function LoginPage() {
  console.log("🔥 LoginPage 렌더링됨");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    console.log("🔥 handleSubmit 실행됨");

    if (e) e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await login(username, password);

      console.log("🔥 응답:", res.data); // 👈 핵심 확인

      // ✅ 토큰 안전하게 추출
      const token = res.data.token || res.data.accessToken;

      if (!token) {
        console.log("❌ 토큰 없음");
        throw new Error("토큰 없음");
      }

      // ✅ 토큰 저장
      localStorage.setItem("token", token);
      console.log("✅ 저장된 토큰:", token);

      // ✅ 페이지 이동
      navigate("/dashboard");
    } catch (err) {
      console.log("🔥 에러:", err);
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-icon">♻️</div>
        <h1>Auto Recycle Helper</h1>
        <p className="login-subtitle">관리자 로그인</p>

        <form>
          <div className="input-group">
            <label>아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            type="button"
            className="login-btn"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}