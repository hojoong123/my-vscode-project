import { useEffect, useState } from "react";
import { getLogs } from "../api/devices";
import "./LogsPage.css";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    getLogs()
      .then((res) => {
        setLogs(res.data);
        if (res.data.length > 0) setSelected(res.data[0]);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">로딩 중...</div>;

  const filtered = filter === "ALL" ? logs : logs.filter((l) => {
    const type = l.trashTypeCode || l.trash_type_code || l.trashType || "";
    return type === filter;
  });

  return (
    <div className="logs-page">
      <div className="logs-header">
        <div>
          <h1>📋 분류 기록</h1>
          <p>전체 {logs.length}건의 분류 이벤트</p>
        </div>
        <div className="filter-btns">
          {["ALL", "PLASTIC", "CAN", "GLASS", "GENERAL"].map((f) => (
            <button
              key={f}
              className={"filter-btn" + (filter === f ? " active" : "")}
              onClick={() => setFilter(f)}
            >
              {f === "ALL" ? "전체" : f}
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
                    <span className="log-type-badge">{type}</span>
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