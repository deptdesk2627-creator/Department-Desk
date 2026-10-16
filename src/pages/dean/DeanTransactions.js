import Transactions from "../secretary/transactions/Transactions";

// Dean monitors every request but cannot create or modify document histories.
function DeanTransactions({ data, search }) {
  return (
    <Transactions
      requests={data.requests}
      setRequests={data.setRequests}
      search={search}
      readOnly
    />
  );
}

export default DeanTransactions;
