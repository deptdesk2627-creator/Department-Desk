function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <section className="page-heading">
      <div className="page-heading__row">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions}
      </div>
    </section>
  );
}

export default PageHeader;
