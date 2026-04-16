import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getDevices, getBins, getLogs, getErrors, resetBin } from "../api/devices";
import useWebSocket from "../hooks/useWebSocket";
import "./DashboardPage.css";

export default function DashboardPage() {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceIdx, setSelectedDeviceIdx] = useState(0);
  const [bins, setBins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  useWebSocket([
    { topic: "/topic/events", callback: () => fetchAll() },
    { topic: "/topic/errors", callback: (data) => setErrors((prev) => [data, ...prev]) },
  ]);

  const fetchAll = async () => {
    try {
      const [devRes, logRes, errRes] = await Promise.all([getDevices(), getLogs(), getErrors()]);
      setDevices(devRes.data);
      setLogs(logRes.data);
      setErrors(errRes.data);
      if (devRes.data.length > 0) {
        const binRes = await getBins(devRes.data[selectedDeviceIdx]?.id || devRes.data[0].id);
        setBins(binRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (devices.length > 0) {
      getBins(devices[selectedDeviceIdx]?.id || devices[0].id)
        .then((res) => setBins(res.data))
        .catch((err) => console.error(err));
    }
  }, [selectedDeviceIdx, devices]);

  const handleReset = async (binId) => {
    if (!window.confirm("이 통을 리셋하시겠습니까?")) return;
    try {
      await resetBin(binId);
      const res = await getBins(devices[selectedDeviceIdx].id);
      setBins(res.data);
    } catch (err) {
      alert("리셋 실패");
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const getBarColor = (percent) => {
    if (percent >= 90) return "#ef4444";
    if (percent >= 70) return "#f59e0b";
    return "#22c55e";
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return "-";
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return "방금 전";
    if (diff < 60) return diff + "분 전";
    if (diff < 1440) return Math.floor(diff / 60) + "시간 전";
    return Math.floor(diff / 1440) + "일 전";
  };

  const getTimeOnly = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const filteredBins = searchQuery
    ? bins.filter((bin) => {
        const q = searchQuery.toLowerCase();
        const typeCode = (bin.trashTypeCode || bin.trash_type_code || bin.typeCode || "").toLowerCase();
        const binCode = (bin.binCode || bin.bin_code || "").toLowerCase();
        return typeCode.includes(q) || binCode.includes(q);
      })
    : bins;

  const unresolvedErrors = (errors || []).filter((e) => !e.resolved);

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="dashboard">
      <div className="dash-top">
        <div>
          <h1>운영 현황</h1>
          <p className="dash-sub">실시간 모니터링 By Network</p>
          {searchQuery && <p className="search-result-text">🔍 "{searchQuery}" 검색 결과</p>}
        </div>
        <button className="refresh-btn" onClick={handleRefresh}>🔄 새로고침</button>
      </div>

      <div className="dash-main-grid">
        {/* 왼쪽: 통별 적재 */}
        <div className="dash-left-section">
          <h2 className="section-title">📦 통별 적재</h2>

          {/* 장치 탭 */}
          <div className="device-tabs">
            {devices.map((dev, idx) => (
              <button
                key={dev.id}
                className={"device-tab" + (selectedDeviceIdx === idx ? " active" : "")}
                onClick={() => setSelectedDeviceIdx(idx)}
              >
                🏢 {dev.deviceCode || dev.device_code || dev.deviceName || "장치 " + (idx + 1)}
              </button>
            ))}
          </div>

          {/* 통 카드 그리드 */}
          <div className="bin-grid">
            {filteredBins.length === 0 ? (
              <div className="empty-msg">
                {searchQuery ? "\"" + searchQuery + "\" 검색 결과가 없습니다." : "등록된 통이 없습니다."}
              </div>
            ) : (
              filteredBins.map((bin) => {
                const percent = bin.fillPercent ?? bin.fillLevel ?? bin.fill_percent ?? 0;
                const typeCode = bin.trashTypeCode || bin.trash_type_code || bin.typeCode || "GENERAL";
                const barColor = getBarColor(percent);
                const typeNames = {
                  PLASTIC: { ko: "플라스틱", en: "Plastic" },
                  CAN: { ko: "캔", en: "Can" },
                  GLASS: { ko: "유리", en: "Glass" },
                  GENERAL: { ko: "일반쓰레기", en: "General Waste" },
                };
                const label = typeNames[typeCode] || { ko: typeCode, en: typeCode };
                const updatedAt = bin.updatedAt || bin.updated_at || bin.lastCollectedAt || bin.last_collected_at;

                return (
                  <div key={bin.id} className={"bin-card" + (percent >= 90 ? " danger" : percent >= 70 ? " warn" : "")}>
                    <div className="bin-card-top">
                      <div>
                        <div className="bin-ko-name">{label.ko}</div>
                        <div className="bin-en-name">{label.en}</div>
                      </div>
                      <button className="bin-reset-btn" onClick={() => handleReset(bin.id || bin.binId)}>
                        ↻ Reset
                      </button>
                    </div>
                    <div className="bin-fill-row">
                      <span className="bin-fill-label">적재량</span>
                      <span className="bin-fill-value" style={{ color: barColor }}>{percent}%</span>
                    </div>
                    <div className="bin-bar-bg">
                      <div className="bin-bar-fill" style={{ width: percent + "%", background: barColor }}></div>
                    </div>
                    <div className="bin-time">🕐 {getTimeAgo(updatedAt)}</div>
                  </div>
                );
              })
            )}
          </div>

          <div className="inspection-btn-area">
            <button className="inspection-btn">✉️ 점검 알림 전송</button>
          </div>
        </div>

        {/* 오른쪽: 경고 목록 + 네트워크 상태 */}
        <div className="dash-right-section">
          <div className="warning-panel">
            <div className="warning-header">
              <div>
                <h3>경고 목록</h3>
                <p className="warning-sub">즉시 조치 필요항목</p>
              </div>
              <span className="warning-count">{unresolvedErrors.length} Total</span>
            </div>

            <div className="warning-list">
              {unresolvedErrors.length === 0 ? (
                <div className="warning-empty">🎉 현재 경고가 없습니다.</div>
              ) : (
                unresolvedErrors.slice(0, 5).map((err) => (
                  <div key={err.id} className="warning-item">
                    <span className="warning-icon">⚠</span>
                    <div className="warning-body">
                      <div className="warning-title">{err.message || err.errorType || "오류 발생"}</div>
                      <div className="warning-meta">
                        {getTimeAgo(err.createdAt || err.created_at)} • #{err.id}
                      </div>
                    </div>
                    <span className="warning-arrow">›</span>
                  </div>
                ))
              )}
            </div>

            <button className="warning-view-all" onClick={() => navigate("/errors")}>전체 오류 보기</button>
          </div>

          <div className="network-panel">
            <h4 className="network-title">네트워크 상태</h4>
            <div className="network-row">
              <span>활성 장치</span>
              <span className="network-value">{devices.length} / {devices.length}</span>
            </div>
            <div className="network-row">
              <span>게이트웨이 상태</span>
              <span className="network-value online">{devices.length} Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* 하단: 분류 기록 테이블 */}
      <div className="logs-section">
        <div className="logs-section-header">
          <h2 className="section-title">📋 분류 기록</h2>
          <button className="logs-view-all" onClick={() => navigate("/logs")}>전체 보기 →</button>
        </div>

        <div className="logs-table-wrap">
          <table className="logs-table">
            <thead>
              <tr>
                <th>시간</th>
                <th>장치 / 통</th>
                <th>이벤트 종류</th>
                <th>정확도 %</th>
                <th>상태</th>
                <th>비고</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {(logs || []).length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-row">기록이 없습니다.</td>
                </tr>
              ) : (
                (logs || []).slice(0, 10).map((log) => {
  const type = log.trashTypeCode || log.trash_type_code || log.trashType || "-";
  const conf = log.confidence ? Math.round(log.confidence * 100) : 0;

  // 🔥 핵심: confidence 50 이하 = 강제 불량 처리
  const isDefective =
    log.isDefective || log.is_defective || (conf > 0 && conf <= 50);

  const fill = log.fillPercent ?? log.fill_percent ?? 0;

  let statusClass = "success";
  let statusText = "Success";

  // 🔥 상태 판단 (우선순위 중요)
  if (isDefective) {
    statusClass = "critical";
    statusText = "Defective";
  } else if (fill >= 90) {
    statusClass = "critical";
    statusText = "Full";
  } else if (fill >= 70) {
    statusClass = "warning";
    statusText = "Almost Full";
  } else if (conf > 50 && conf <= 80) {
    statusClass = "warning";
    statusText = "Low Accuracy";
  }

  return (
    <tr key={log.id}>
      <td className="log-time-cell">
        {getTimeOnly(log.createdAt || log.created_at)}
      </td>

      <td className="log-device-cell">
        <strong>{log.binCode || log.bin_code || "-"}</strong>
      </td>

      <td>
        <span className={"log-event-badge " + (isDefective ? "critical" : "")}>
          {isDefective ? "불량 감지" : type + " 분류"}
        </span>
      </td>

      {/* 🔥 적재율 색상 (여기가 핵심) */}
      <td>
        <span
          style={{
            color:
              isDefective ? "#ef4444" :   // 🔴 불량 (confidence ≤ 50)
              fill >= 90 ? "#ef4444" :    // 🔴 가득 참
              fill >= 70 ? "#f59e0b" :    // 🟡 경고
              "#1a1a2e",                  // 🟢 정상
            fontWeight: 600
          }}
        >
          {conf > 0 ? conf + "%" : "-"}
        </span>
      </td>

      <td>
        <span className={"log-status-pill " + statusClass}>
          {statusText}
        </span>
      </td>

      <td className="log-note-cell">
        {log.defectReason ||
          log.defect_reason ||
          (isDefective ? "확인 필요" : "정상 처리")}
      </td>

      <td>
        <button
          className="log-detail-link"
          onClick={() => navigate("/logs")}
        >
          View Details
        </button>
      </td>
    </tr>
  );
})
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}