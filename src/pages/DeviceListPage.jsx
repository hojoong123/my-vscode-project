import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDevices, getBins } from "../api/devices";
import "./DeviceListPage.css";

export default function DeviceListPage() {
  const [devices, setDevices] = useState([]);
  const [binData, setBinData] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDevices()
      .then(async (res) => {
        setDevices(res.data);
        const binMap = {};
        for (const device of res.data) {
          try {
            const binRes = await getBins(device.id);
            binMap[device.id] = binRes.data;
          } catch {
            binMap[device.id] = [];
          }
        }
        setBinData(binMap);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="device-list-page">
      <div className="dl-header">
        <div>
          <h1>🖥️ 장치 상세</h1>
          <p>전체 장치의 상세 정보와 통 상태를 확인하세요</p>
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="empty-state">등록된 장치가 없습니다.</div>
      ) : (
        devices.map((device) => {
          const bins = binData[device.id] || [];
          return (
            <div key={device.id} className="dl-card">
              <div className="dl-card-header">
                <div className="dl-card-left">
                  <div className="dl-device-icon">🖥️</div>
                  <div>
                    <div className="dl-device-code">{device.deviceCode || device.device_code || "DEVICE"}</div>
                    <div className="dl-device-location">📍 {device.location || device.deviceName || "위치 미설정"}</div>
                  </div>
                </div>
                <div className="dl-card-right">
                  <span className="dl-status-badge">● 정상</span>
                  <button className="dl-detail-btn" onClick={() => navigate("/devices/" + device.id)}>
                    상세 보기 →
                  </button>
                </div>
              </div>

              {bins.length > 0 && (
                <div className="dl-bins">
                  {bins.map((bin) => {
                    const percent = bin.fillPercent ?? bin.fillLevel ?? bin.fill_percent ?? 0;
                    const typeCode = bin.trashTypeCode || bin.trash_type_code || bin.typeCode || "GENERAL";
                    let barColor = "#22c55e";
                    if (percent >= 90) barColor = "#ef4444";
                    else if (percent >= 70) barColor = "#f59e0b";

                    return (
                      <div key={bin.id} className="dl-bin-item">
                        <div className="dl-bin-top">
                          <span className="dl-bin-type">{typeCode}</span>
                          <span className="dl-bin-percent" style={{ color: barColor }}>{percent}%</span>
                        </div>
                        <div className="dl-bin-bar-bg">
                          <div className="dl-bin-bar-fill" style={{ width: percent + "%", background: barColor }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}