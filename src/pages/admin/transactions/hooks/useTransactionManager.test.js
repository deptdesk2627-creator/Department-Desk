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
  expect(request.student).toBe("Jordan Lee");
  expect(request.history).toHaveLength(1);
  expect(request.history[0].status).toBe("Under Review");
  expect(addRequest([request])[0].id).toBe(`${request.id}-1`);
});

test("filters requests by the normalized status and shared search", () => {
  const requests = [
    { id: "1", student: "Alex", status: "Waiting", document: "Leave form" },
    { id: "2", student: "Sam", status: "Approved", document: "Travel form" },
  ];
  const { result } = renderHook(() =>
    useTransactionManager({ requests, setRequests: jest.fn(), search: "leave" }),
  );

  expect(result.current.visibleRequests).toEqual([requests[0]]);
  act(() => result.current.setActiveFilter("Action Needed"));
  expect(result.current.visibleRequests).toEqual([requests[0]]);
  act(() => result.current.setActiveFilter("Approved"));
  expect(result.current.visibleRequests).toEqual([]);
});
