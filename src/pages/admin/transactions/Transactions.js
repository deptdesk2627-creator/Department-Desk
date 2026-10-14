import "./Transactions.css";
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
}) {
  const manager = useTransactionManager({ requests, setRequests, search });

  return (
    <div className="dashboard module-page transactions-page">
      <section className="page-heading">
        <div>
          <p className="eyebrow">OFFICE WORKSPACE · REQUESTS</p>
          <h1>Request tracker</h1>
          <p className="page-subtitle">
            Follow every request from submission through approval.
          </p>
        </div>
      </section>
      <TransactionForm
        form={manager.form}
        setForm={manager.setForm}
        formError={manager.formError}
        onSubmit={manager.addRequest}
        offices={manager.offices}
        categories={manager.categories}
        statuses={manager.statuses}
      />
      <TransactionList
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
