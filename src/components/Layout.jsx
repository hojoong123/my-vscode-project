import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "./Layout.css";

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={() => navigate("/dashboard")}>
          <span className="logo-icon">♻️</span>
          <div>
            <div className="logo-title">Auto Recycle</div>
            <div className="logo-sub">Management System</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">메인</div>
          <NavLink to="/dashboard" className={({isActive}) => "sidebar-item" + (isActive ? " active" : "")}>
            <span className="sidebar-icon">📊</span>
            <span>대시보드</span>
          </NavLink>

          <div className="nav-section-label">관리</div>
          <NavLink to="/devices" className={({isActive}) => "sidebar-item" + (isActive ? " active" : "")}>
            <span className="sidebar-icon">🖥️</span>
            <span>장치 상세</span>
          </NavLink>
          <NavLink to="/logs" className={({isActive}) => "sidebar-item" + (isActive ? " active" : "")}>
            <span className="sidebar-icon">📋</span>
            <span>분류 기록</span>
          </NavLink>
          <NavLink to="/errors" className={({isActive}) => "sidebar-item" + (isActive ? " active" : "")}>
            <span className="sidebar-icon">⚠️</span>
            <span>오류 / 경고</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">👤</div>
            <div>
              <div className="admin-name">관리자</div>
              <div className="admin-role">Administrator</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
        </div>
      </aside>

      <div className="layout-right">
        <header className="topbar">
          <div className="topbar-left">
            <h2 className="page-title-bar">Auto Recycle Helper</h2>
          </div>
          <div className="topbar-right">
            <div className="search-box">
              <span>🔍</span>
              <input type="text" placeholder="장치 / 통 검색..." />
            </div>
            <button className="topbar-icon-btn">🔔</button>
            <button className="topbar-icon-btn">⚙️</button>
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
    </div>
  );
}