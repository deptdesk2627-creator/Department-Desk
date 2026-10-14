import { useState } from "react";
import "./Sidebar.css";
import SidebarNavigation from "./SidebarNavigation";
import SidebarProfile from "./SidebarProfile";

function SideBar({ currentPage, onNavigate, isOpen = true, onToggle }) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  function navigateTo(page) {
    setIsProfileMenuOpen(false);
    onNavigate?.(page);
  }

  return (
    <aside
      id="workspace-sidebar"
      className={`workspace-sidebar${isOpen ? "" : " workspace-sidebar--collapsed"}`}
      aria-label="Main navigation"
    >
      <div className="workspace-sidebar__main">
        <div className="workspace-sidebar__top">
          <button
            className="workspace-sidebar__brand"
            type="button"
            onClick={() => navigateTo("dashboard")}
            aria-label="DeptDesk home"
            title={!isOpen ? "DeptDesk home" : undefined}
          >
            <span className="workspace-sidebar__brand-mark" aria-hidden="true">
              D
            </span>
            <span className="workspace-sidebar__brand-name">
              <strong>Dept</strong>
              <span>Desk</span>
            </span>
          </button>
        </div>
        {onToggle && (
          <button
            className="workspace-sidebar__toggle"
            type="button"
            onClick={onToggle}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={isOpen}
            aria-controls="workspace-sidebar"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={isOpen ? "m14.5 5-7 7 7 7" : "m9.5 5 7 7-7 7"} />
            </svg>
            <span>{isOpen ? "Collapse sidebar" : "Expand sidebar"}</span>
          </button>
        )}
        <SidebarNavigation
          currentPage={currentPage}
          isOpen={isOpen}
          onNavigate={navigateTo}
        />
      </div>

      <SidebarProfile
        isMenuOpen={isProfileMenuOpen}
        onToggleMenu={() => setIsProfileMenuOpen((open) => !open)}
        onNavigate={navigateTo}
      />
    </aside>
  );
}

export default SideBar;
