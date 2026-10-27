import { useMemo, useState } from "react";
import { PageHeader } from "../../components/ui";
import { DEFAULT_SETTINGS } from "../../constants/system";
import { getFaqForRole } from "./helpContent";
import "./SystemPages.css";

function HelpPage({ role, settings, search = "" }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

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
      />

      <section className="card panel system-help-toolbar">
        <input
          className="system-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search frequently asked questions…"
          aria-label="Search frequently asked questions"
        />
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
        <section className="card panel">
          <p className="system-hint">
            No answers match “{query || search}”. Try another word, or contact
            the office below.
          </p>
        </section>
      ) : (
        <div className="system-faq-grid">
          {visibleSections.map((section) => (
            <section key={section.id} className="card panel system-faq-card">
              <div className="panel-heading">
                <h2>{section.title}</h2>
                <span className="system-count-pill">
                  {section.items.length}{" "}
                  {section.items.length === 1 ? "topic" : "topics"}
                </span>
              </div>
              <div className="system-faq-list">
                {section.items.map((item) => (
                  <details
                    key={item.q}
                    className="system-faq-item"
                    open={Boolean(combinedQuery) || undefined}
                  >
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <section className="card panel system-contact-banner">
        <div className="system-contact-banner__head">
          <div>
            <h2>Contact the office</h2>
            <p>
              Still stuck, or found something that isn&apos;t working? Reach the
              department office directly.
            </p>
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
