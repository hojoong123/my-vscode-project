import client from "./client";

const BASE = "/notifications";

// localStorage의 adminId를 헤더로 전송
const authHeader = () => ({
  headers: {
    "X-Admin-Id": localStorage.getItem("adminId") || "",
  },
});

export const sendInspectionRequest = (data) =>
  client.post(`${BASE}/inspection-request`, data, authHeader());

export const sendInspectionDone = (data) =>
  client.post(`${BASE}/inspection-done`, data, authHeader());

export const getNotifications = () =>
  client.get(BASE, authHeader());

export const getUnreadCount = () =>
  client.get(`${BASE}/unread-count`, authHeader());

export const markNotificationRead = (id) =>
  client.patch(`${BASE}/${id}/read`, null, authHeader());

export const confirmNotification = (id) =>
  client.patch(`${BASE}/${id}/confirm`, null, authHeader());