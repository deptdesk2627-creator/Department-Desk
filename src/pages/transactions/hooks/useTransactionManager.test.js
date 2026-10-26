import { act, renderHook } from "@testing-library/react";
import { useTransactionManager } from "./useTransactionManager";

test("validates and adds a request with a collision-free ID and initial history", () => {
  const setRequests = jest.fn();
  const { result } = renderHook(() =>
    useTransactionManager({ requests: [], setRequests, search: "" }),
  );
  const preventDefault = jest.fn();

  act(() => {
    result.current.setForm({
      ...result.current.form,
      student: "Jordan Lee",
      document: "Enrollment form",
      status: "Under Review",
    });
  });
  act(() => {
    result.current.addRequest({ preventDefault });
  });

  expect(preventDefault).toHaveBeenCalled();
  expect(result.current.formError).toBe("");
  expect(setRequests).toHaveBeenCalledTimes(1);
  const addRequest = setRequests.mock.calls[0][0];
  const [request] = addRequest([]);
  expect(request.id).toMatch(/^REQ-\d{4}-\d{6}$/);
  expect(request.direction).toBe("outgoing");
  expect(request.student).toBe("Jordan Lee");
  expect(request.history).toHaveLength(1);
  expect(request.history[0].status).toBe("Under Review");
  expect(addRequest([request])[0].id).toBe(`${request.id}-1`);
});

test("filters requests by status, office, category, search, and resets filters", () => {
  const requests = [
    {
      id: "1",
      student: "Alex",
      status: "Waiting",
      document: "Leave form",
      office: "HR Office",
      type: "Request",
    },
    {
      id: "2",
      student: "Sam",
      status: "Approved",
      document: "Travel form",
      office: "Finance Office",
      type: "Document",
    },
  ];
  const { result } = renderHook(() =>
    useTransactionManager({ requests, setRequests: jest.fn(), search: "" }),
  );

  expect(result.current.visibleRequests).toHaveLength(2);

  act(() => result.current.setActiveFilter("Action Needed"));
  expect(result.current.visibleRequests).toEqual([requests[0]]);

  act(() => result.current.setActiveFilter("All Requests"));
  act(() => result.current.setOfficeFilter("Finance Office"));
  expect(result.current.visibleRequests).toEqual([requests[1]]);

  act(() => result.current.setCategoryFilter("Request"));
  expect(result.current.visibleRequests).toEqual([]);
  expect(result.current.hasActiveFilters).toBe(true);

  act(() => result.current.resetFilters());
  expect(result.current.hasActiveFilters).toBe(false);
  expect(result.current.visibleRequests).toHaveLength(2);
});

test("logs an incoming document with INC prefix and updates signature and forwarding state", () => {
  const setRequests = jest.fn();
  const initialRequests = [
    {
      id: "REQ-2026-000001",
      direction: "outgoing",
      student: "Jordan Lee",
      document: "Leave form",
      office: "HR Office",
      type: "Request",
      status: "Pending",
    },
    {
      id: "INC-2026-000002",
      direction: "incoming",
      student: "Registrar Clerk",
      document: "Cross-enrollment endorsement",
      office: "Registrar",
      type: "Document",
      status: "Received",
      signedByOffice: "Unsigned",
      forwardedTo: "Not sent out",
      history: [{ id: "h-1", status: "Received", note: "Logged" }],
    },
  ];

  const { result } = renderHook(() =>
    useTransactionManager({
      requests: initialRequests,
      setRequests,
      search: "",
    }),
  );

  expect(result.current.outgoingCount).toBe(1);
  expect(result.current.incomingCount).toBe(1);
  expect(result.current.visibleRequests).toEqual([initialRequests[0]]);

  act(() => result.current.setActiveTab("incoming"));
  expect(result.current.visibleRequests).toEqual([initialRequests[1]]);

  act(() => {
    result.current.updateIncomingRequest("INC-2026-000002", {
      signedByOffice: "Signed by Dean",
      forwardedTo: "Dean's Office",
    });
  });

  expect(setRequests).toHaveBeenCalledTimes(1);
  const updater = setRequests.mock.calls[0][0];
  const updated = updater(initialRequests);
  expect(updated[1].signedByOffice).toBe("Signed by Dean");
  expect(updated[1].forwardedTo).toBe("Dean's Office");
  expect(updated[1].history).toHaveLength(3);
  expect(updated[1].history[1].status).toBe("Signed by Dean");
  expect(updated[1].history[2].status).toBe("Sent Out");
});
