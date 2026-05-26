import { useState } from "react";
import { sendInspectionRequest } from "../api/notifications";
import "./InspectionRequestModal.css";

export default function InspectionRequestModal({ devices, currentDevice, onClose }) {
  const floorMap = { DEVICE_001: 1, DEVICE_002: 2 };
  const defaultFloor = currentDevice
    ? floorMap[currentDevice.deviceCode] ?? 1
    : 1;

  const [floor, setFloor] = useState(defaultFloor);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!floor) return alert("층을 선택하세요.");
    setSending(true);
    try {
      await sendInspectionRequest({
        floor: Number(floor),
        deviceId: currentDevice?.id,
        message: message || `${floor}층 쓰레기통 점검이 필요합니다.`,
      });
      alert(`${floor}층 관리자에게 점검 알림을 전송했습니다.`);
      onClose();
    } catch (err) {
      alert("전송 실패: " + (err.response?.data?.message || err.message));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3>✉️ 점검 알림 전송</h3>
        <p className="modal-sub">해당 층 담당 관리자에게 점검 요청을 보냅니다.</p>

        <label className="modal-label">대상 층</label>
        <select value={floor} onChange={(e) => setFloor(e.target.value)}>
          <option value={1}>1층</option>
          <option value={2}>2층</option>
        </select>

        <label className="modal-label">메시지 (선택)</label>
        <textarea
          rows={3}
          value={message}
          placeholder="예: 캔통이 가득 찼습니다. 즉시 점검 부탁드립니다."
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose} disabled={sending}>
            취소
          </button>
          <button className="btn-send" onClick={handleSubmit} disabled={sending}>
            {sending ? "전송 중..." : "전송"}
          </button>
        </div>
      </div>
    </div>
  );
}