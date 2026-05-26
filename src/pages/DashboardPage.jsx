import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getDevices,
  getBins,
  getLogs,
  getErrors,
  resetBin,
} from '../api/devices';
import useWebSocket from '../hooks/useWebSocket';
import './DashboardPage.css';
import { filterDevicesByRole, filterByDeviceCode } from '../utils/auth';
import InspectionRequestModal from '../components/InspectionRequestModal';
import NotificationBell from '../components/NotificationBell';

export default function DashboardPage() {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceIdx, setSelectedDeviceIdx] = useState(0);
  const [bins, setBins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const username = localStorage.getItem('username') || '';
  const isAdmin = username === 'admin';
  const [showInspectionModal, setShowInspectionModal] = useState(false);

  useWebSocket([
    { topic: '/topic/events', callback: () => fetchAll() },
    {
      topic: '/topic/errors',
      callback: (data) => setErrors((prev) => [data, ...prev]),
    },
    {
      topic: '/topic/staff',

      callback: (data) => {
        console.log('직원 호출 수신:', data);

        alert(data.message);
      },
    },
  ]);

  const fetchAll = async () => {
    try {
      const [devRes, logRes, errRes] = await Promise.all([
        getDevices(),
        getLogs(),
        getErrors(),
      ]);
      const allowedDevices = filterDevicesByRole(devRes.data);
      setDevices(allowedDevices);
      setLogs(filterByDeviceCode(logRes.data));
      setErrors(errRes.data);
      if (devRes.data.length > 0) {
        const binRes = await getBins(
          devRes.data[selectedDeviceIdx]?.id || devRes.data[0].id,
        );
        setBins(binRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (devices.length > 0) {
      getBins(devices[selectedDeviceIdx]?.id || devices[0].id)
        .then((res) => setBins(res.data))
        .catch((err) => console.error(err));
    }
  }, [selectedDeviceIdx, devices]);

  const handleReset = async (binId) => {
    if (!window.confirm('이 통을 리셋하시겠습니까?')) return;
    try {
      await resetBin(binId);
      const res = await getBins(devices[selectedDeviceIdx].id);
      setBins(res.data);
    } catch (err) {
      alert('리셋 실패');
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm('현재 장치의 모든 통을 비우시겠습니까?')) return;
    try {
      const currentDevice = devices[selectedDeviceIdx];
      if (!currentDevice) return;
      await Promise.all(bins.map((bin) => resetBin(bin.id || bin.binId)));
      const res = await getBins(currentDevice.id);
      setBins(res.data);
      alert('모든 통이 비워졌습니다.');
    } catch (err) {
      alert(
        '전체 비우기 실패: ' + (err.response?.data?.message || err.message),
      );
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const getTypeColor = (typeCode) => {
    switch (typeCode) {
      case 'PLASTIC':
        return '#22c55e';
      case 'CAN':
        return '#f59e0b';
      case 'GLASS':
        return '#3b82f6';
      case 'GENERAL':
        return '#94a3b8';
      case 'BEVERAGE':
        return '#ef4444';
      default:
        return '#94a3b8';
    }
  };

  const getPercentColor = (percent) => {
    if (percent >= 90) return '#ef4444';
    if (percent >= 70) return '#f59e0b';
    return '#22c55e';
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '-';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return '방금 전';
    if (diff < 60) return diff + '분 전';
    if (diff < 1440) return Math.floor(diff / 60) + '시간 전';
    return Math.floor(diff / 1440) + '일 전';
  };

  const getTimeOnly = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const typeOrder = ['PLASTIC', 'CAN', 'GLASS', 'GENERAL', 'BEVERAGE'];

  const sortedBins = [...bins].sort((a, b) => {
    const aType =
      a.trashTypeCode || a.trash_type_code || a.typeCode || 'GENERAL';
    const bType =
      b.trashTypeCode || b.trash_type_code || b.typeCode || 'GENERAL';
    const ai = typeOrder.indexOf(aType);
    const bi = typeOrder.indexOf(bType);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const filteredBins = searchQuery
    ? sortedBins.filter((bin) => {
        const q = searchQuery.toLowerCase();
        const typeCode = (
          bin.trashTypeCode ||
          bin.trash_type_code ||
          bin.typeCode ||
          ''
        ).toLowerCase();
        const binCode = (bin.binCode || bin.bin_code || '').toLowerCase();
        return typeCode.includes(q) || binCode.includes(q);
      })
    : sortedBins;

  const unresolvedErrors = (errors || []).filter((e) => !e.resolved);

  if (loading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="dashboard">
      <div className="dash-top">
        <div>
          <h1>운영 현황</h1>
          <p className="dash-sub">실시간 모니터링 By Network</p>
          {searchQuery && (
            <p className="search-result-text">🔍 "{searchQuery}" 검색 결과</p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NotificationBell />
          <button className="refresh-btn" onClick={handleRefresh}>
            🔄 새로고침
          </button>
        </div>
      </div>

      <div className="dash-main-grid">
        {/* 왼쪽: 통별 적재 */}
        <div className="dash-left-section">
          <h2 className="section-title">📦 통별 적재</h2>

          {/* 장치 탭 */}
          <div className="device-tabs">
            {devices.map((dev, idx) => {
              const code = dev.deviceCode || dev.device_code || '';
              const displayNames = {
                DEVICE_001: '쓰레기통 (1층)',
                DEVICE_002: '쓰레기통 (2층)',
              };
              const displayName =
                displayNames[code] || dev.deviceName || '장치 ' + (idx + 1);
              return (
                <button
                  key={dev.id}
                  className={
                    'device-tab' + (selectedDeviceIdx === idx ? ' active' : '')
                  }
                  onClick={() => setSelectedDeviceIdx(idx)}
                >
                  🏢 {displayName}
                </button>
              );
            })}
          </div>

          {/* 통 카드 그리드 (가로 5칸) */}
          <div className="bin-grid">
            {filteredBins.length === 0 ? (
              <div className="empty-msg">
                {searchQuery
                  ? '"' + searchQuery + '" 검색 결과가 없습니다.'
                  : '등록된 통이 없습니다.'}
              </div>
            ) : (
              filteredBins.map((bin) => {
                const percent =
                  bin.fillPercent ?? bin.fillLevel ?? bin.fill_percent ?? 0;
                const typeCode =
                  bin.trashTypeCode ||
                  bin.trash_type_code ||
                  bin.typeCode ||
                  'GENERAL';
                const typeColor = getTypeColor(typeCode);
                const percentColor = getPercentColor(percent);
                const typeNames = {
                  PLASTIC: { ko: '플라스틱', en: 'Plastic' },
                  CAN: { ko: '캔', en: 'Can' },
                  GLASS: { ko: '유리', en: 'Glass' },
                  GENERAL: { ko: '일반쓰레기', en: 'General Waste' },
                  BEVERAGE: { ko: '음료수', en: 'Beverage' },
                };
                const label = typeNames[typeCode] || {
                  ko: typeCode,
                  en: typeCode,
                };
                const updatedAt =
                  bin.updatedAt ||
                  bin.updated_at ||
                  bin.lastCollectedAt ||
                  bin.last_collected_at;

                return (
                  <div
                    key={bin.id}
                    className={
                      'bin-card' +
                      (percent >= 90 ? ' danger' : percent >= 70 ? ' warn' : '')
                    }
                  >
                    <div className="bin-card-top">
                      <div className="bin-ko-name" style={{ color: typeColor }}>
                        {label.ko}
                      </div>
                      <button
                        className="bin-reset-btn"
                        onClick={() => handleReset(bin.id || bin.binId)}
                      >
                        ↻
                      </button>
                    </div>

                    <div className="bin-fill-box">
                      <div
                        className="bin-fill-inner"
                        style={{
                          height: percent + '%',
                          background: typeColor,
                        }}
                      ></div>
                    </div>

                    <div
                      className="bin-percent-text"
                      style={{ color: percentColor }}
                    >
                      {percent}%
                    </div>
                    <div className="bin-en-name">{label.en}</div>
                    <div className="bin-time">🕐 {getTimeAgo(updatedAt)}</div>
                  </div>
                );
              })
            )}
          </div>

          <div className="inspection-btn-area">
            <button
              className="detail-btn"
              onClick={() => {
                const currentDevice = devices[selectedDeviceIdx];
                if (currentDevice) {
                  navigate('/devices/' + currentDevice.id);
                } else {
                  alert('선택된 장치가 없습니다.');
                }
              }}
            >
              🖥️ 장치 상세보기
            </button>
            <button className="reset-all-btn" onClick={handleResetAll}>
              🗑️ 전체 비우기
            </button>
            <button
              className="inspection-btn"
              onClick={() => setShowInspectionModal(true)}
            >
              ✉️ 점검 알림 전송
            </button>
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
              <span className="warning-count">
                {unresolvedErrors.length} Total
              </span>
            </div>

            <div className="warning-list">
              {unresolvedErrors.length === 0 ? (
                <div className="warning-empty">🎉 현재 경고가 없습니다.</div>
              ) : (
                unresolvedErrors.slice(0, 5).map((err) => (
                  <div key={err.id} className="warning-item">
                    <span className="warning-icon">⚠</span>
                    <div className="warning-body">
                      <div className="warning-title">
                        {err.message || err.errorType || '오류 발생'}
                      </div>
                      <div className="warning-meta">
                        {getTimeAgo(err.createdAt || err.created_at)} • #
                        {err.id}
                      </div>
                    </div>
                    <span className="warning-arrow">›</span>
                  </div>
                ))
              )}
            </div>

            <button
              className="warning-view-all"
              onClick={() => navigate('/errors')}
            >
              전체 오류 보기
            </button>
          </div>

          <div className="network-panel">
            <h4 className="network-title">네트워크 상태</h4>
            <div className="network-row">
              <span>활성 장치</span>
              <span className="network-value">
                {devices.length} / {devices.length}
              </span>
            </div>
            <div className="network-row">
              <span>게이트웨이 상태</span>
              <span className="network-value online">
                {devices.length} Online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 하단: 분류 기록 테이블 */}
      {isAdmin && (
        <div className="logs-section">
          <div className="logs-section-header">
            <h2 className="section-title">📋 분류 기록</h2>
            <button className="logs-view-all" onClick={() => navigate('/logs')}>
              전체 보기 →
            </button>
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
                    <td colSpan="7" className="empty-row">
                      기록이 없습니다.
                    </td>
                  </tr>
                ) : (
                  (logs || []).slice(0, 10).map((log) => {
                    const type =
                      log.trashTypeCode ||
                      log.trash_type_code ||
                      log.trashType ||
                      '-';
                    const conf = log.confidence
                      ? Math.round(log.confidence * 100)
                      : 0;
                    const isDefective =
                      log.isDefective ||
                      log.is_defective ||
                      (conf > 0 && conf <= 50);
                    const fill = log.fillPercent ?? log.fill_percent ?? 0;

                    let statusClass = 'success';
                    let statusText = 'Success';

                    if (isDefective) {
                      statusClass = 'critical';
                      statusText = 'Defective';
                    } else if (fill >= 90) {
                      statusClass = 'critical';
                      statusText = 'Full';
                    } else if (fill >= 70) {
                      statusClass = 'warning';
                      statusText = 'Almost Full';
                    } else if (conf > 50 && conf <= 80) {
                      statusClass = 'warning';
                      statusText = 'Low Accuracy';
                    }

                    return (
                      <tr key={log.id}>
                        <td className="log-time-cell">
                          {getTimeOnly(log.createdAt || log.created_at)}
                        </td>
                        <td className="log-device-cell">
                          <strong>{log.binCode || log.bin_code || '-'}</strong>
                        </td>
                        <td>
                          <span
                            className={
                              'log-event-badge ' +
                              (log.eventType === 'RESET'
                                ? 'reset'
                                : isDefective
                                  ? 'critical'
                                  : '')
                            }
                          >
                            {log.eventType === 'RESET'
                              ? '🗑️ ' + type + ' 비우기'
                              : isDefective
                                ? '불량 감지'
                                : type + ' 분류'}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              color: isDefective
                                ? '#ef4444'
                                : fill >= 90
                                  ? '#ef4444'
                                  : fill >= 70
                                    ? '#f59e0b'
                                    : '#1a1a2e',
                              fontWeight: 600,
                            }}
                          >
                            {conf > 0 ? conf + '%' : '-'}
                          </span>
                        </td>
                        <td>
                          <span className={'log-status-pill ' + statusClass}>
                            {statusText}
                          </span>
                        </td>
                        <td className="log-note-cell">
                          {log.defectReason ||
                            log.defect_reason ||
                            (isDefective ? '확인 필요' : '정상 처리')}
                        </td>
                        <td>
                          <button
                            className="log-detail-link"
                            onClick={() => navigate('/logs')}
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
      )}
      {showInspectionModal && (
        <InspectionRequestModal
          devices={devices}
          currentDevice={devices[selectedDeviceIdx]}
          onClose={() => setShowInspectionModal(false)}
        />
      )}
    </div>
  );
}
