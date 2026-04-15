import { useEffect, useState } from "react";
import { getErrors, resolveBinError, resolveDeviceError } from "../api/devices";
import useWebSocket from "../hooks/useWebSocket";
import "./ErrorsPage.css";

export default function ErrorsPage() {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  useWebSocket([
    {
      topic: "/topic/errors",
      callback: (data) => {
        setErrors((prev) => [data, ...prev]);
      },
    },
  ]);

  useEffect(() => {
    getErrors()
      .then((res) => setErrors(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = async (error) => {
    if (!window.confirm("이 오류를 해결 처리하시겠습니까?")) return;
    try {
      if (error.type === "DEVICE" || error.errorCategory === "DEVICE") {
        await resolveDeviceError(error.id);
      } else {
        await resolveBinError(error.id);
      }
      const res = await getErrors();
      setErrors(res.data);
    } catch (err) {
      alert("처리 실패: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  const unresolved = errors.filter((e) => !e.resolved);
  const resolved = errors.filter((e) => e.resolved);

  return (
    <div className="errors-page">
      <div className="page-header">
        <h1>⚠️ 오류 / 경고</h1>
        <p>장치 및 통 오류 현황을 확인하고 해결하세요</p>
      </div>

      <div className="error-stats">
        <div className="error-stat-card red">
          <span className="error-stat-value">{unresolved.length}</span>
          <span className="error-stat-label">미해결</span>
        </div>
        <div className="error-stat-card green">
          <span className="error-stat-value">{resolved.length}</span>
          <span className="error-stat-label">해결 완료</span>
        </div>
      </div>

      {unresolved.length > 0 && (
        <>
          <h2 className="section-title">🔴 미해결 오류</h2>
          <div className="error-list">
            {unresolved.map((err) => (
              <div key={err.id} className="error-card unresolved">
                <div className="error-card-left">
                  <div className="error-type-badge">{err.errorType || err.error_type || "ERROR"}</div>
                  <div className="error-message">{err.message || "오류 상세 정보 없음"}</div>
                  <div className="error-date">
                    {err.createdAt || err.created_at
                      ? new Date(err.createdAt || err.created_at).toLocaleString("ko-KR")
                      : "-"}
                  </div>
                </div>
                <button className="resolve-btn" onClick={() => handleResolve(err)}>
                  ✅ 해결 처리
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {resolved.length > 0 && (
        <>
          <h2 className="section-title" style={{marginTop: 32}}>✅ 해결 완료</h2>
          <div className="error-list">
            {resolved.map((err) => (
              <div key={err.id} className="error-card resolved">
                <div className="error-card-left">
                  <div className="error-type-badge resolved">{err.errorType || err.error_type || "ERROR"}</div>
                  <div className="error-message">{err.message || "오류 상세 정보 없음"}</div>
                  <div className="error-date">
                    {err.createdAt || err.created_at
                      ? new Date(err.createdAt || err.created_at).toLocaleString("ko-KR")
                      : "-"}
                  </div>
                </div>
                <span className="resolved-label">해결됨</span>
              </div>
            ))}
          </div>
        </>
      )}

      {errors.length === 0 && (
        <div className="empty-state">
          <p>🎉 오류가 없습니다! 모든 시스템이 정상입니다.</p>
        </div>
      )}
    </div>
  );
}