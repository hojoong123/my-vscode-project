import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead, confirmNotification } from "../api/notifications";
import useWebSocket from "../hooks/useWebSocket";
import "./NotificationBell.css";

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const adminId = localStorage.getItem("adminId");
  const role = localStorage.getItem("role");

  const unread = items.filter((n) => n.status === "SENT").length;

  const load = async () => {
    try {
      const res = await getNotifications();
      setItems(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (adminId) load(); }, [adminId]);

  useWebSocket(
    adminId
      ? [{
          topic: `/topic/notifications/${adminId}`,
          callback: (data) => {
            setItems((prev) => [data, ...prev]);
            if (Notification.permission === "granted") {
              new Notification(data.title, { body: data.message });
            }
          },
        }]
      : []
  );

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleItemClick = async (n) => {
    if (n.status === "SENT") {
      await markNotificationRead(n.id);
    }
    // 총괄 관리자가 INSPECTION_COMPLETE를 보면 확인 처리
    if (role === "SUPER_ADMIN" && n.type === "INSPECTION_COMPLETE" && n.status !== "CONFIRMED") {
      await confirmNotification(n.id);
    }
    load();
  };

  return (
    <div className="bell-wrap">
      <button className="bell-btn" onClick={() => setOpen(!open)}>
        🔔
        {unread > 0 && <span className="bell-badge">{unread}</span>}
      </button>

      {open && (
        <div className="bell-dropdown">
          <div className="bell-header">알림 ({unread} 미확인)</div>
          {items.length === 0 ? (
            <div className="bell-empty">알림이 없습니다.</div>
          ) : (
            items.slice(0, 15).map((n) => (
              <div
                key={n.id}
                className={"bell-item" + (n.status === "SENT" ? " unread" : "")}
                onClick={() => handleItemClick(n)}
              >
                <div className="bell-item-title">{n.title}</div>
                <div className="bell-item-msg">{n.message}</div>
                <div className="bell-item-meta">
                  {n.senderName} • {new Date(n.sentAt).toLocaleString("ko-KR")}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}