import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDevice, getBins, resetBin } from "../api/devices";
import useWebSocket from "../hooks/useWebSocket";
import "./DeviceDetailPage.css";

const TRASH_LABELS = {
  PLASTIC: { name: "플라스틱 / PET", sub: "RECYCLABLES", emoji: "🥤" },
  CAN: { name: "알루미늄 캔", sub: "METAL", emoji: "🥫" },
  GLASS: { name: "유리병", sub: "GLASS", emoji: "🍾" },
  GENERAL: { name: "일반 쓰레기", sub: "LANDFILL", emoji: "🗑️" },
};

function getBarColor(percent) {
  if (percent >= 90) return "#ef4444";
  if (percent >= 70) return "#f59e0b";
  return "#22c55e";
}

function getStatusText(percent) {
  if (percent >= 90) return "위험";
  if (percent >= 70) return "주의";
  return "양호";
}

export default function DeviceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);

  useWebSocket([
    {
      topic: "/topic/devices/" + id + "/bins",
      callback: (data) => {
        setBins((prev) => prev.map((b) => (b.id === data.id ? { ...b, ...data } : b)));
      },
    },
  ]);

  useEffect(() => {
    Promise.all([getDevice(id), getBins(id)])
      .then(([deviceRes, binsRes]) => {
        setDevice(deviceRes.data);
        setBins(binsRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReset = async (binId) => {
    if (!window.confirm("이 통을 리셋하시겠습니까?")) return;
    try {
      await resetBin(binId);
      const res = await getBins(id);
      setBins(res.data);
    } catch (err) {
      alert("리셋 실패: " + (err.response?.data?.message || err.message));
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    Promise.all([getDevice(id), getBins(id)])
      .then(([deviceRes, binsRes]) => {
        setDevice(deviceRes.data);
        setBins(binsRes.data);
      })
      .finally(() => setLoading(false));
  };

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="device-detail">
      <button className="back-btn" onClick={() => navigate("/dashboard")}>← 대시보드로 돌아가기</button>

      <div className="detail-top">
        <div className="detail-title-area">
          <h1>{device?.deviceCode || device?.device_code || "DEVICE"}</h1>
          <span className="badge-online">● 정상 동작</span>
          <span className="badge-version">v1.0.0</span>
        </div>
        <div className="detail-location">📍 {device?.location || device?.deviceName || "위치 미설정"}</div>
        <div className="detail-actions">
          <button className="action-btn" onClick={handleRefresh}>🔄 새로고침</button>
          <button className="action-btn">⚙️ 설정</button>
          <button className="action-btn warn-btn">🔧 점검 요청</button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="panel info-panel">
          <h3>📋 장치 정보</h3>
          <div className="info-rows">
            <div className="info-row">
              <span className="info-row-icon green-bg">💚</span>
              <div className="info-row-body">
                <div className="info-row-label">시스템 상태</div>
                <div className="info-row-value">정상 가동 중</div>
                <div className="info-row-sub">시스템 정상도 96%</div>
              </div>
            </div>
            <div className="info-row">
              <span className="info-row-icon blue-bg">🌐</span>
              <div className="info-row-body">
                <div className="info-row-label">네트워크</div>
                <div className="info-row-value">양호</div>
              </div>
            </div>
            <div className="info-row">
              <span className="info-row-icon purple-bg">🕐</span>
              <div className="info-row-body">
                <div className="info-row-label">최근 동기화</div>
                <div className="info-row-value">{new Date().toLocaleString("ko-KR")}</div>
              </div>
            </div>
          </div>

          <h3 style={{marginTop: 24}}>🔧 센서 상태</h3>
          <div className="sensor-grid">
            <div className="sensor-row"><span>카메라 센서</span><span className="sensor-ok">정상</span></div>
            <div className="sensor-row"><span>무게 모터</span><span className="sensor-ok">정상</span></div>
            <div className="sensor-row"><span>액추에이터</span><span className="sensor-warn">주의</span></div>
            <div className="sensor-row"><span>초음파 센서</span><span className="sensor-ok">정상</span></div>
          </div>
        </div>

        <div className="panel bins-panel">
          <div className="bins-top">
            <h3>🗑️ 통별 적재 상태</h3>
            <span className="realtime-tag">● 실시간</span>
          </div>

          {bins.length === 0 ? (
            <div className="empty-state">등록된 통이 없습니다.</div>
          ) : (
            bins.map((bin) => {
              const percent = bin.fillPercent ?? bin.fillLevel ?? bin.fill_percent ?? 0;
              const typeCode = bin.trashTypeCode || bin.trash_type_code || bin.typeCode || "GENERAL";
              const label = TRASH_LABELS[typeCode] || { name: typeCode, sub: "", emoji: "📦" };
              const barColor = getBarColor(percent);
              const isCritical = percent >= 90;
              const statusText = getStatusText(percent);

              return (
                <div key={bin.id} className={"bin-card" + (isCritical ? " critical" : "")}>
                  <div className="bin-top-row">
                    <div className="bin-info">
                      <span className="bin-emoji">{label.emoji}</span>
                      <div>
                        <div className="bin-name">{label.name}</div>
                        <div className="bin-sub">{label.sub}</div>
                      </div>
                    </div>
                    <div className="bin-actions">
                      <span className="bin-percent" style={{color: barColor}}>{percent}%</span>
                      <span className={"bin-status-tag " + (isCritical ? "danger" : percent >= 70 ? "warn" : "ok")}>
                        {statusText}
                      </span>
                      <button className="reset-btn" onClick={() => handleReset(bin.id || bin.binId)}>↻ 리셋</button>
                    </div>
                  </div>
                  <div className="bin-bar-track">
                    <div className="bin-bar-fill" style={{ width: percent + "%", background: barColor }}></div>
                  </div>
                  {isCritical && <div className="bin-danger-msg">⚠ 수거가 필요합니다!</div>}
                </div>
              );
            })
          )}

          <div className="predict-box">
            <span className="predict-icon">📊</span>
            <div>
              <div className="predict-title">수거 예측</div>
              <div className="predict-desc">현재 적재량 기준 약 6.5시간 후 가득 찰 예정입니다.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}