import { useState } from "react";
import "./Transactions.css";
import { PageHeader } from "../../components/ui";
import TransactionDrawer from "./components/TransactionDrawer";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";
import { useTransactionManager } from "./hooks/useTransactionManager";

function Transactions({
  requests = [],
  setRequests = () => {
    throw new Error("Transactions requires a setRequests callback.");
  },
  search = "",
  readOnly = false,
}) {
  const manager = useTransactionManager({ requests, setRequests, search });
  const [isFormOpen, setIsFormOpen] = useState(false);

  function openNewModal() {
    manager.setForm((current) => ({
      ...current,
      direction: manager.activeTab,
      status:
        manager.activeTab === "incoming"
          ? manager.incomingStatuses.includes(current.status)
            ? current.status
            : "Received"
          : manager.outgoingStatuses.includes(current.status)
            ? current.status
            : "Pending",
    }));
    setIsFormOpen(true);
  }

  function handleFormSubmit(event) {
    const targetDirection =
      manager.form.direction === "incoming" ? "incoming" : "outgoing";
    if (manager.addRequest(event)) {
      manager.setActiveTab(targetDirection);
      setIsFormOpen(false);
    }
  }

  return (
    <div className="dashboard module-page transactions-page">
      <PageHeader
        eyebrow="OFFICE WORKSPACE · REQUESTS"
        title="Request tracker"
        subtitle={
          readOnly
            ? "Monitor outgoing requests and incoming office documents. View only — updates are made by the Secretary."
            : "Follow outgoing requests and track incoming documents from other offices, signatures, and releases."
        }
        actions={
          !readOnly && (
            <div className="page-heading__actions">
              <button
                type="button"
                className="primary-button"
                aria-haspopup="dialog"
                aria-expanded={isFormOpen}
                onClick={openNewModal}
              >
                {manager.activeTab === "incoming"
                  ? "＋ Log incoming"
                  : "＋ New request"}
              </button>
            </div>
          )
        }
      />
      {!readOnly && (
        <TransactionForm
          isOpen={isFormOpen}
          form={manager.form}
          setForm={manager.setForm}
          formError={manager.formError}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
          offices={manager.offices}
          categories={manager.categories}
          outgoingStatuses={manager.outgoingStatuses}
          incomingStatuses={manager.incomingStatuses}
          signatureOptions={manager.signatureOptions}
          forwardedDestinations={manager.forwardedDestinations}
        />
      )}

      <div className="transactions-workspace">
        <div className="transactions-tabs-bar">
          <div
            className="transactions-folder-tabs"
            role="tablist"
            aria-label="Request tracker views"
          >
            <button
              type="button"
              role="tab"
              aria-selected={manager.activeTab === "outgoing"}
              className={`transactions-folder-tab ${manager.activeTab === "outgoing" ? "is-active" : ""}`}
              onClick={() => manager.setActiveTab("outgoing")}
            >
              <span>Outgoing</span>
              <span className="transactions-tab-badge">
                {manager.outgoingCount}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={manager.activeTab === "incoming"}
              className={`transactions-folder-tab ${manager.activeTab === "incoming" ? "is-active" : ""}`}
              onClick={() => manager.setActiveTab("incoming")}
            >
              <span>Incoming</span>
              <span className="transactions-tab-badge">
                {manager.incomingCount}
              </span>
            </button>
          </div>
        </div>

        <TransactionList
          activeTab={manager.activeTab}
          readOnly={readOnly}
          requests={manager.visibleRequests}
          totalRequests={manager.tabTotalRequests}
          activeFilter={manager.activeFilter}
          setActiveFilter={manager.setActiveFilter}
          filters={manager.filters}
          officeFilter={manager.officeFilter}
          setOfficeFilter={manager.setOfficeFilter}
          offices={manager.offices}
          categoryFilter={manager.categoryFilter}
          setCategoryFilter={manager.setCategoryFilter}
          categories={manager.categories}
          hasActiveFilters={manager.hasActiveFilters}
          onResetFilters={manager.resetFilters}
          requestSearch={manager.requestSearch}
          setRequestSearch={manager.setRequestSearch}
          view={manager.view}
          setView={manager.setView}
          statuses={manager.statuses}
          signatureOptions={manager.signatureOptions}
          forwardedDestinations={manager.forwardedDestinations}
          statusClass={manager.statusClass}
          getRequestStatus={manager.getRequestStatus}
          requestName={manager.requestName}
          requestOffice={manager.requestOffice}
          requestCategory={manager.requestCategory}
          formatDate={manager.formatDate}
          onUpdateStatus={manager.updateStatus}
          onUpdateIncoming={manager.updateIncomingRequest}
          onSelect={manager.setSelectedTransaction}
          onExport={manager.exportRequest}
          onDelete={manager.deleteRequest}
        />
      </div>

      <TransactionDrawer
        request={manager.selectedTransaction}
        trail={manager.requestTrail}
        getRequestStatus={manager.getRequestStatus}
        requestName={manager.requestName}
        requestOffice={manager.requestOffice}
        requestCategory={manager.requestCategory}
        statusClass={manager.statusClass}
        onClose={() => manager.setSelectedTransaction(null)}
      />
    </div>
  );
}

export default Transactions;
