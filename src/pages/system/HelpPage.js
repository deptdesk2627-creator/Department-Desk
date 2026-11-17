import { useMemo, useState } from "react";
import { PageHeader } from "../../components/ui";
import { DEFAULT_SETTINGS } from "../../constants/system";
import { SystemIcon } from "./components/SystemIcons";
import {
  getFaqForRole,
  KEYBOARD_SHORTCUTS,
  WORKFLOW_GUIDES,
} from "./helpContent";
import "./SystemShared.css";
import "./HelpPage.css";

function HelpPage({ role, settings, search = "", onNavigate }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandAll, setExpandAll] = useState(false);

  const isStaff = role?.id === "staff";
  const sections = useMemo(() => getFaqForRole(role?.id), [role?.id]);
  const combinedQuery = (
    query.trim() || String(search || "").trim()
  ).toLowerCase();

  const visibleSections = useMemo(() => {
    const filtered =
      activeCategory === "all"
        ? sections
        : sections.filter((section) => section.id === activeCategory);

    if (!combinedQuery) return filtered;

    return filtered
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          `${item.q} ${item.a}`.toLowerCase().includes(combinedQuery),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [sections, activeCategory, combinedQuery]);

  const totalTopics = useMemo(
    () => visibleSections.reduce((sum, s) => sum + s.items.length, 0),
    [visibleSections],
  );

  const office = { ...DEFAULT_SETTINGS, ...settings };
  const contactRows = [
    ["Office", office.department],
    ["Location", office.officeLocation],
    ["Office hours", office.officeHours],
    ["Email", office.contactEmail],
    ["Phone", office.contactPhone],
  ].filter(([, value]) => value);

  const categoryTabs = [{ id: "all", title: "All topics" }, ...sections];

  return (
    <div className="dashboard module-page system-page">
      <PageHeader
        eyebrow="SYSTEM · HELP"
        title="Help & FAQ"
        subtitle="Answers to common questions about documents, tasks, supplies, and office workflows."
        actions={
          <div className="system-header-actions">
            <span className="system-status-badge system-status-badge--neutral">
              {totalTopics} {totalTopics === 1 ? "topic" : "topics"}
            </span>
            <button
              type="button"
              className="secondary-button system-header-btn"
              aria-pressed={expandAll}
              onClick={() => setExpandAll((open) => !open)}
            >
              {expandAll ? "Collapse all" : "Expand all"}
            </button>
          </div>
        }
      />

      <section className="card system-card system-help-toolbar">
        <div className="system-help-toolbar__top">
          <div className="system-input-wrap system-help-search-wrap">
            <span className="system-input-wrap__icon">
              <SystemIcon name="search" size={16} />
            </span>
            <input
              className="system-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search frequently asked questions…"
              aria-label="Search frequently asked questions"
            />
          </div>
        </div>
        <div
          className="system-filter-pills"
          role="tablist"
          aria-label="FAQ categories"
        >
          {categoryTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeCategory === tab.id}
              onClick={() => setActiveCategory(tab.id)}
            >
              {tab.title}
            </button>
          ))}
        </div>
      </section>

      {visibleSections.length === 0 ? (
        <section className="card system-card">
          <p className="system-hint">
            No answers match “{query || search}”. Try another word, or contact
            the office below.
          </p>
        </section>
      ) : (
        <div className="system-faq-grid">
          {visibleSections.map((section) => (
            <section
              key={section.id}
              className="card system-card system-faq-card"
            >
              <div className="system-card-head">
                <div className="system-card-head__title">
                  <span className="system-card-icon">
                    <SystemIcon name="helpCircle" />
                  </span>
                  <div>
                    <h2>{section.title}</h2>
                    <p>Common questions and step-by-step guidance.</p>
                  </div>
                </div>
                <span className="system-count-pill">
                  {section.items.length}{" "}
                  {section.items.length === 1 ? "topic" : "topics"}
                </span>
              </div>

              <div className="system-faq-list">
                {section.items.map((item) => {
                  const targetPage =
                    isStaff && (item.staffPage || section.staffPage)
                      ? item.staffPage || section.staffPage
                      : item.page || section.page;
                  const actionLabel = item.actionLabel || section.actionLabel;
                  return (
                    <details
                      key={item.q}
                      className="system-faq-item"
                      open={Boolean(combinedQuery) || expandAll || undefined}
                    >
                      <summary>{item.q}</summary>
                      <div className="system-faq-answer">
                        <p>{item.a}</p>
                        {onNavigate && targetPage && actionLabel && (
                          <button
                            type="button"
                            className="text-button system-faq-link"
                            onClick={() => onNavigate(targetPage)}
                          >
                            {actionLabel} →
                          </button>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <div
        className={`system-guide-grid${isStaff ? " system-guide-grid--single" : ""}`}
      >
        {!isStaff && (
          <section className="card system-card">
            <div className="system-card-head">
              <div className="system-card-head__title">
                <span className="system-card-icon">
                  <SystemIcon name="folder" />
                </span>
                <div>
                  <h2>Document workflow &amp; cabinet guide</h2>
                  <p>
                    Quick reference for outgoing requests, incoming signatures,
                    and filing cabinets.
                  </p>
                </div>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  className="text-button system-faq-link"
                  onClick={() => onNavigate("transactions")}
                >
                  Open Request Tracker →
                </button>
              )}
            </div>
            <div className="system-guide-list">
              {WORKFLOW_GUIDES.map((guide) => (
                <div key={guide.id} className="system-guide-block">
                  <strong>{guide.title}</strong>
                  <p>{guide.description}</p>
                  {guide.steps && (
                    <ol className="system-workflow-steps">
                      {guide.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  )}
                  {guide.cabinets && (
                    <ul className="system-cabinet-badges">
                      {guide.cabinets.map((cabinet) => (
                        <li key={cabinet}>{cabinet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="card system-card system-shortcuts-card">
          <div className="system-card-head">
            <div className="system-card-head__title">
              <span className="system-card-icon">
                <SystemIcon name="keyboard" />
              </span>
              <div>
                <h2>Keyboard shortcuts &amp; quick tips</h2>
                <p>Navigate DeptDesk faster using your keyboard.</p>
              </div>
            </div>
          </div>
          <ul className="system-shortcuts-list">
            {KEYBOARD_SHORTCUTS.map((shortcut) => (
              <li key={shortcut.keys}>
                <kbd>{shortcut.keys}</kbd>
                <span>{shortcut.label}</span>
              </li>
            ))}
          </ul>
          <p className="system-shortcuts-tip">
            Tip: You can also use the top search bar from any page to jump
            directly to a request ID, task title, or supply item.
          </p>
        </section>
      </div>

      <section className="card system-card system-contact-banner">
        <div className="system-card-head">
          <div className="system-card-head__title">
            <span className="system-card-icon">
              <SystemIcon name="mail" />
            </span>
            <div>
              <h2>Contact the office</h2>
              <p>
                Still stuck, or found something that isn&apos;t working? Reach
                the department office directly.
              </p>
            </div>
          </div>
          <span className="system-status-badge system-status-badge--dot">
            Support active
          </span>
        </div>

        <div className="system-inset-banner">
          <div className="system-inset-banner__main">
            <span className="system-card-icon">
              <SystemIcon name="building" size={18} />
            </span>
            <div className="system-office-summary">
              <strong>{office.department}</strong>
              <span>{office.officeHours || "Standard office hours"}</span>
            </div>
          </div>
          {office.contactEmail && (
            <a
              className="primary-button system-mail-button"
              href={`mailto:${office.contactEmail}?subject=${encodeURIComponent(
                "DeptDesk support request",
              )}`}
            >
              Email the office
            </a>
          )}
        </div>

        <dl className="system-contact-grid">
          {contactRows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                {label === "Email" ? (
                  <a href={`mailto:${value}`}>{value}</a>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

export default HelpPage;
