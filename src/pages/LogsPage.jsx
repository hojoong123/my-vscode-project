import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getLogs } from "../api/devices";
import "./LogsPage.css";
import { filterByDeviceCode } from "../utils/auth";

const TYPE_LABELS = {
  ALL: "전체",
  PLASTIC: "플라스틱",
  CAN: "캔",
  GLASS: "유리",
  GENERAL: "일반쓰레기",
  BEVERAGE: "음료수",
  RESET: "통 비우기",
};

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [deviceFilter, setDeviceFilter] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

// 🔥 URL ?type=PLASTIC 같은 쿼리스트링이 있으면 해당 필터 자동 적용
useEffect(() => {
  const typeParam = searchParams.get("type");
  const deviceParam = searchParams.get("deviceId");
  if (typeParam && ["PLASTIC", "CAN", "GLASS", "GENERAL", "BEVERAGE", "RESET"].includes(typeParam)) {
    setFilter(typeParam);
  } else {
    setFilter("ALL");
  }
  setDeviceFilter(deviceParam ? Number(deviceParam) : null);
}, [searchParams]);

  useEffect(() => {
    getLogs()
      .then((res) => {
      const filtered = filterByDeviceCode(res.data);
      setLogs(filtered);
      if (filtered.length > 0) setSelected(filtered[0]);
    })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleFilterClick = (f) => {
  setFilter(f);
  const params = {};
  if (f !== "ALL") params.type = f;
  if (deviceFilter !== null) params.deviceId = String(deviceFilter);
  setSearchParams(params);
};

// 👇 추가: 전체 보기 (모든 필터 해제)
const handleShowAll = () => {
  setFilter("ALL");
  setDeviceFilter(null);
  setSearchParams({});
};

  if (loading) return <div className="loading">로딩 중...</div>;

  const filtered = logs.filter((l) => {
  const eventType = l.eventType || l.event_type || "CLASSIFY";
  const type = l.trashTypeCode || l.trash_type_code || l.trashType || "";

  // 종류 필터
  if (filter === "RESET") {
    if (eventType !== "RESET") return false;
  } else if (filter !== "ALL") {
    if (eventType === "RESET") return false;  // 일반 종류 필터일 땐 RESET 제외
    if (type !== filter) return false;
  }

  // 장치 필터
  if (deviceFilter !== null) {
    const logDeviceId = l.deviceId || l.device_id;
    if (Number(logDeviceId) !== deviceFilter) return false;
  }

  return true;
});

  return (
    <div className="logs-page">
      <div className="logs-header">
        <div>
          <h1>
            📋 분류 기록
            {filter !== "ALL" && <span className="filter-tag">{TYPE_LABELS[filter]}</span>}
            {deviceFilter !== null && (
              <span className="filter-tag device-tag">
                🏢 {deviceFilter === 1 ? "쓰레기통 (1층)" : deviceFilter === 2 ? "쓰레기통 (2층)" : "장치 #" + deviceFilter}
              </span>
            )}
          </h1>
          <p>
            {filter === "ALL" && deviceFilter === null
              ? "전체 " + logs.length + "건의 분류 이벤트"
              : "조건에 맞는 " + filtered.length + "건"}
          </p>
        </div>
        <div className="filter-btns">
          {(filter !== "ALL" || deviceFilter !== null) && (
            <button className="filter-btn show-all-btn" onClick={handleShowAll}>
              ✕ 전체 보기
            </button>
          )}
          {["ALL", "PLASTIC", "CAN", "GLASS", "GENERAL", "BEVERAGE", "RESET"].map((f) => (
            <button
              key={f}
              className={"filter-btn" + (filter === f ? " active" : "")}
              onClick={() => handleFilterClick(f)}
            >
              {TYPE_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="logs-layout">
        <div className="logs-list-panel">
          {filtered.length === 0 ? (
            <div className="empty-state">기록이 없습니다.</div>
          ) : (
            filtered.map((log) => {
              const type = log.trashTypeCode || log.trash_type_code || log.trashType || "-";
              const isSelected = selected?.id === log.id;
              return (
                <div
                  key={log.id}
                  className={"log-item" + (isSelected ? " selected" : "")}
                  onClick={() => setSelected(log)}
                >
                  <div className="log-item-top">
                    <span className={"log-type-badge" + (log.eventType === "RESET" ? " reset" : "")}>
                      {log.eventType === "RESET" ? "🗑️ 비우기" : type}
                    </span>
                    <span className="log-time">
                      {log.createdAt || log.created_at
                        ? new Date(log.createdAt || log.created_at).toLocaleString("ko-KR")
                        : "-"}
                    </span>
                  </div>
                  <div className="log-item-mid">
                    장치: {log.deviceCode || log.device_code || "-"} &nbsp;|&nbsp;
                    통: {log.binCode || log.bin_code || "-"}
                  </div>
                  <div className="log-item-bottom">
                    신뢰도: {log.confidence ? (log.confidence * 100).toFixed(1) + "%" : "-"}
                    &nbsp;&nbsp;
                    <span className={"log-status " + (log.status === "PROCESSED" ? "ok" : "pending")}>
                      {log.status || "PROCESSED"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="logs-detail-panel">
          {selected ? (
            <>
              <h3>🔍 상세 정보</h3>
              <div className="detail-table">
                <div className="detail-row">
                  <span className="detail-key">ID</span>
                  <span className="detail-val">{selected.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">장치 코드</span>
                  <span className="detail-val">{selected.deviceCode || selected.device_code || "-"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">통 코드</span>
                  <span className="detail-val">{selected.binCode || selected.bin_code || "-"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">쓰레기 종류</span>
                  <span className="detail-val">
                    <span className="log-type-badge">
                      {selected.trashTypeCode || selected.trash_type_code || selected.trashType || "-"}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">신뢰도</span>
                  <span className="detail-val confidence-val">
                    {selected.confidence ? (selected.confidence * 100).toFixed(1) + "%" : "-"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">상태</span>
                  <span className="detail-val">
                    <span className={"log-status " + (selected.status === "PROCESSED" ? "ok" : "pending")}>
                      {selected.status || "PROCESSED"}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-key">불량 여부</span>
                  <span className="detail-val">{selected.isDefective || selected.is_defective ? "⚠️ 불량" : "정상"}</span>
                </div>
                {(selected.defectReason || selected.defect_reason) && (
                  <div className="detail-row">
                    <span className="detail-key">불량 사유</span>
                    <span className="detail-val">{selected.defectReason || selected.defect_reason}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-key">일시</span>
                  <span className="detail-val">
                    {selected.createdAt || selected.created_at
                      ? new Date(selected.createdAt || selected.created_at).toLocaleString("ko-KR")
                      : "-"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">왼쪽에서 기록을 선택하세요.</div>
          )}
        </div>
      </div>
    </div>
  );
}
