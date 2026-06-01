import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import "./ManagersPage.css";

export default function ManagersPage() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  useEffect(() => {
    // 총괄 관리자가 아니면 막기
    if (role !== "SUPER_ADMIN") {
      alert("접근 권한이 없습니다.");
      navigate("/");
      return;
    }
    client.get("/admins/floor-managers")
      .then((res) => setManagers(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="managers-page">
      <div className="managers-top">
            <button
                className="back-btn"
                onClick={() => navigate("/dashboard")}
            >
                ← 메인으로 돌아가기
            </button>
            <h1>👥 층별 관리자</h1>
            <p className="managers-sub">현장 담당 관리자 명단</p>
        </div>

      <div className="manager-grid">
        {managers.length === 0 ? (
          <div className="empty-msg">등록된 관리자가 없습니다.</div>
        ) : (
          managers.map((m) => (
            <div key={m.id} className="manager-card">
              <div className="manager-photo-wrap">
                {m.photoUrl ? (
                  <img
                    src={`http://localhost:8080${m.photoUrl}`}
                    alt={m.name}
                    className="manager-photo"
                  />
                ) : (
                  <div className="manager-photo-empty">👤</div>
                )}
              </div>
              <div className="manager-name">{m.name}</div>
              <div className="manager-position">{m.position || `${m.floor}층 담당`}</div>
              <div className="manager-info">
                <div><span>아이디</span><b>{m.username}</b></div>
                <div><span>생년월일</span><b>{m.birthDate || "-"}</b></div>
                <div><span>전화번호</span><b>{m.phone || "-"}</b></div> 
                <div><span>담당 층</span><b>{m.floor ? `${m.floor}층` : "-"}</b></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}