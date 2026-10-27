import { useEffect } from "react";
import "./Sidebar.css";
import SidebarLogout from "./SidebarLogout";
import SidebarNavigation from "./SidebarNavigation";

function SideBar({
  role,
  currentPage,
  onNavigate,
  onLogout,
  isOpen = true,
  onToggle,
}) {
  const homePage = role?.pages?.[0] || "dashboard";

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);

  return (
    <aside
      id="workspace-sidebar"
      className={`workspace-sidebar${isOpen ? "" : " workspace-sidebar--collapsed"}`}
      aria-label="Main navigation"
    >
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
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m14.5 6-6 6 6 6" />
          </svg>
          <span className="sr-only">
            {isOpen ? "Collapse sidebar" : "Expand sidebar"}
          </span>
        </button>
      )}

      <div className="workspace-sidebar__main">
        <div className="workspace-sidebar__top">
          <button
            className="workspace-sidebar__brand"
            type="button"
            onClick={() => onNavigate?.(homePage)}
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

        <SidebarNavigation
          currentPage={currentPage}
          isOpen={isOpen}
          onNavigate={onNavigate}
          allowedPages={role?.pages}
        />
      </div>

      <SidebarLogout onLogout={onLogout} isOpen={isOpen} />
    </aside>
  );
}

export default SideBar;
