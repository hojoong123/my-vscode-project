// src/utils/auth.js

export function getCurrentUsername() {
  return localStorage.getItem("username") || "";
}

// 현재 로그인한 관리자가 볼 수 있는 device 코드 목록
export function getAllowedDeviceCodes() {
  const username = getCurrentUsername();
  if (username === "floor1") return ["DEVICE_001"];
  if (username === "floor2") return ["DEVICE_002"];
  return null; // admin 또는 그 외 → 전체 허용
}

// device 객체 하나가 현재 사용자에게 허용되는지
export function canAccessDevice(device) {
  const allowed = getAllowedDeviceCodes();
  if (allowed === null) return true; // 전체 허용
  const code = device?.deviceCode || device?.device_code || "";
  return allowed.includes(code);
}

// device 배열을 권한에 맞게 필터링
export function filterDevicesByRole(devices) {
  const allowed = getAllowedDeviceCodes();
  if (allowed === null) return devices;
  return devices.filter((d) => {
    const code = d.deviceCode || d.device_code || "";
    return allowed.includes(code);
  });
}

// log/bin 등에서 deviceCode 필드로 필터
export function filterByDeviceCode(items) {
  const allowed = getAllowedDeviceCodes();
  if (allowed === null) return items;
  return items.filter((item) => {
    const code = item.deviceCode || item.device_code || "";
    return allowed.includes(code);
  });
}