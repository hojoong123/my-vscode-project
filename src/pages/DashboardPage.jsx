import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDevices, getErrors, getLogs } from "../api/devices";
import useWebSocket from "../hooks/useWebSocket";
import "./DashboardPage.css";

export default function DashboardPage() {
  const [devices, setDevices] = useState([]);
  const [errorCount, setErrorCount] = useState(0);
  const [warnCount, setWarnCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useWebSocket([
    { topic: "/topic/events", callback: () => setTodayCount((c) => c + 1) },
    { topic: "/topic/errors", callback: (data) => alert("⚠️ " + (data.message || "오류 발생")) },
  ]);

  useEffect(() => {
    Promise.all([getDevices(), getErrors(), getLogs()])
      .then(([devRes, errRes, logRes]) => {
        setDevices(devRes.data);
        const errs = errRes.data || [];
        setErrorCount(errs.filter((e) => !e.resolved && (e.errorType === "ERROR" || e.errorType === "DEVICE_ERROR")).length);
        setWarnCount(errs.filter((e) => !e.resolved && (e.errorType === "CAPACITY_WARNING" || e.errorType === "WARNING")).length);
        const today = new Date().toDateString();
        setTodayCount((logRes.data || []).filter((l) => {
          const d = l.createdAt || l.created_at;
          return d && new Date(d).toDateString() === today;
        }).length);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    getDevices()
      .then((res) => setDevices(res.data))
      .finally(() => setLoading(false));
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1>📊 메인 대시보드</h1>
          <p>전체 장치 현황을 한눈에 확인하세요</p>
        </div>
        <button className="refresh-btn" onClick={handleRefresh}>🔄 새로고침</button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon-box blue">🖥️</div>
          <div className="stat-body">
            <div className="stat-value">{devices.length}</div>
            <div className="stat-label">전체 장치</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box green">✅</div>
          <div className="stat-body">
            <div className="stat-value">{devices.length - errorCount}</div>
            <div className="stat-label">정상 가동</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box yellow">⚠️</div>
          <div className="stat-body">
            <div className="stat-value">{warnCount}</div>
            <div className="stat-label">경고</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box red">🚨</div>
          <div className="stat-body">
            <div className="stat-value">{errorCount}</div>
            <div className="stat-label">오류</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box teal">📦</div>
          <div className="stat-body">
            <div className="stat-value">{todayCount}</div>
            <div className="stat-label">오늘 분류</div>
          </div>
        </div>
      </div>

      <div className="dash-main">
        <div className="dash-left">
          <h2 className="section-title">📡 장치 목록</h2>
          <div className="device-grid">
            {devices.length === 0 ? (
              <div className="empty-state">등록된 장치가 없습니다.</div>
            ) : (
              devices.map((device) => (
                <div
                  key={device.id}
                  className="device-card"
                  onClick={() => navigate("/devices/" + device.id)}
                >
                  <div className="dc-header">
                    <span className="dc-code">{device.deviceCode || device.device_code || "DEVICE"}</span>
                    <span className="dc-status ok">● 정상</span>
                  </div>
                  <div className="dc-location">📍 {device.location || device.deviceName || "위치 미설정"}</div>
                  <div className="dc-footer">
                    <span className="dc-link">상세 보기 →</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dash-right">
          <h2 className="section-title">🔔 최근 알림</h2>
          <div className="alert-panel">
            {warnCount === 0 && errorCount === 0 ? (
              <div className="alert-empty">🎉 현재 알림이 없습니다.</div>
            ) : (
              <>
                {errorCount > 0 && (
                  <div className="alert-item critical">
                    <span className="alert-dot red"></span>
                    <div>
                      <div className="alert-title">오류 {errorCount}건 발생</div>
                      <div className="alert-sub">즉시 확인이 필요합니다</div>
                    </div>
                  </div>
                )}
                {warnCount > 0 && (
                  <div className="alert-item warning">
                    <span className="alert-dot yellow"></span>
                    <div>
                      <div className="alert-title">경고 {warnCount}건</div>
                      <div className="alert-sub">적재량을 확인하세요</div>
                    </div>
                  </div>
                )}
              </>
            )}
            <button className="alert-view-btn" onClick={() => navigate("/errors")}>
              전체 오류 보기 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}