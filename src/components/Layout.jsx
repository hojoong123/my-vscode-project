import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Layout.css";

export default function Layout() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchText.trim()) {
      navigate("/dashboard?search=" + encodeURIComponent(searchText.trim()));
    }
  };

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-left">
          <div className="logo" onClick={() => navigate("/dashboard")}>
            <span className="logo-icon">♻️</span>
            <span className="logo-text">Auto Recycle Helper</span>
          </div>
          <nav className="nav-links">
            <NavLink to="/dashboard" className={({isActive}) => "nav-item" + (isActive ? " active" : "")}>
              📊 대시보드
            </NavLink>
            <NavLink to="/devices" className={({isActive}) => "nav-item" + (isActive ? " active" : "")}>
              🖥️ 장치 상세
            </NavLink>
            <NavLink to="/logs" className={({isActive}) => "nav-item" + (isActive ? " active" : "")}>
              📋 분류 기록
            </NavLink>
            <NavLink to="/errors" className={({isActive}) => "nav-item" + (isActive ? " active" : "")}>
              ⚠️ 오류 / 경고
            </NavLink>
          </nav>
        </div>
        <div className="topbar-right">
          <form className="search-box" onSubmit={handleSearch}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="장치 / 통 검색..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </form>
          <button className="topbar-icon-btn">🔔</button>
          <button className="topbar-icon-btn">⚙️</button>
          <div className="topbar-admin">
            <span className="admin-label">👤 관리자</span>
            <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="bottom-bar">
        <div className="bottom-left">
          <span className="dot green"></span>
          System Online&nbsp;&nbsp;|&nbsp;&nbsp;Last sync: just now&nbsp;&nbsp;|&nbsp;&nbsp;v1.0.0
        </div>
        <div className="bottom-right">
          <span><span className="dot green"></span> NORMAL</span>
          <span><span className="dot yellow"></span> WARNING</span>
          <span><span className="dot red"></span> CRITICAL</span>
        </div>
      </footer>
    </div>
  );
}