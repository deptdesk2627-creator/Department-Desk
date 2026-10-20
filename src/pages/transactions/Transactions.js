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

  function handleFormSubmit(event) {
    manager.addRequest(event);
    if (manager.form.student?.trim() && manager.form.document?.trim()) {
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
            ? "Monitor every request and document. View only — updates are made by the Secretary."
            : "Follow every request from submission through approval."
        }
        actions={
          !readOnly && (
            <div className="page-heading__actions">
              <button
                type="button"
                className={isFormOpen ? "secondary-button" : "primary-button"}
                aria-expanded={isFormOpen}
                onClick={() => setIsFormOpen((open) => !open)}
              >
                {isFormOpen ? "✕ Close form" : "＋ New request"}
              </button>
            </div>
          )
        }
      />
      {!readOnly && isFormOpen && (
        <TransactionForm
          form={manager.form}
          setForm={manager.setForm}
          formError={manager.formError}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
          offices={manager.offices}
          categories={manager.categories}
          statuses={manager.statuses}
        />
      )}
      <TransactionList
        readOnly={readOnly}
        requests={manager.visibleRequests}
        totalRequests={Array.isArray(requests) ? requests.length : 0}
        activeFilter={manager.activeFilter}
        setActiveFilter={manager.setActiveFilter}
        filters={manager.filters}
        requestSearch={manager.requestSearch}
        setRequestSearch={manager.setRequestSearch}
        view={manager.view}
        setView={manager.setView}
        statuses={manager.statuses}
        statusClass={manager.statusClass}
        getRequestStatus={manager.getRequestStatus}
        requestName={manager.requestName}
        requestOffice={manager.requestOffice}
        requestCategory={manager.requestCategory}
        formatDate={manager.formatDate}
        onUpdateStatus={manager.updateStatus}
        onSelect={manager.setSelectedTransaction}
        onExport={manager.exportRequest}
        onDelete={manager.deleteRequest}
      />
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
