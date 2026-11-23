import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled workspace render error.", error, errorInfo);
  }

  handleReload() {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          role="alert"
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "var(--bg, #f8fafc)",
          }}
        >
          <section
            className="card panel"
            style={{ maxWidth: "460px", width: "100%", textAlign: "center" }}
          >
            <h1 style={{ margin: "0 0 8px", fontSize: "20px" }}>
              Something went wrong
            </h1>
            <p
              style={{
                margin: "0 0 20px",
                color: "var(--muted, #64748b)",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              DeptDesk encountered an unexpected error while rendering this view.
              Reload the workspace to continue.
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={this.handleReload}
            >
              Reload workspace
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
