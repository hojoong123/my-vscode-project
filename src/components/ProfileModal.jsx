import { useEffect, useState } from "react";
import client from "../api/client";
import "./ProfileModal.css";

export default function ProfileModal({ onClose }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    client.get("/admins/me")
      .then((res) => setProfile(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="profile-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="profile-close" onClick={onClose}>✕</button>

        {!profile ? (
          <div className="profile-loading">불러오는 중...</div>
        ) : (
          <>
            <div className="profile-photo-wrap">
              {profile.photoUrl ? (
                <img
                  src={`http://localhost:8080${profile.photoUrl}`}
                  alt={profile.name}
                  className="profile-photo"
                />
              ) : (
                <div className="profile-photo-empty">👤</div>
              )}
            </div>
            <div className="profile-name">{profile.name}</div>
            <div className="profile-position">
              {profile.position ||
                (profile.role === "SUPER_ADMIN" ? "총괄 관리자" : `${profile.floor}층 담당`)}
            </div>

            <div className="profile-info">
              <div><span>아이디</span><b>{profile.username}</b></div>
              <div><span>생년월일</span><b>{profile.birthDate || "-"}</b></div>
              <div><span>전화번호</span><b>{profile.phone || "-"}</b></div>
              <div><span>역할</span><b>{profile.role === "SUPER_ADMIN" ? "총괄 관리자" : "층 관리자"}</b></div>
              {profile.floor && (
                <div><span>담당 층</span><b>{profile.floor}층</b></div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}