import {
  getRequestStatus,
  isRequestOpen,
  isRequestWaiting,
  REQUEST_STATUSES,
} from "./requestStatus";

test("exports frozen request status constants", () => {
  expect(REQUEST_STATUSES).toEqual({
    PENDING: "Pending",
    UNDER_REVIEW: "Under Review",
    ACTION_NEEDED: "Action Needed",
    APPROVED: "Approved",
    ARCHIVED: "Archived",
  });
  expect(Object.isFrozen(REQUEST_STATUSES)).toBe(true);
});

test("maps legacy request statuses to the current workflow", () => {
  expect(getRequestStatus("Not started")).toBe(REQUEST_STATUSES.PENDING);
  expect(getRequestStatus("Started")).toBe(REQUEST_STATUSES.UNDER_REVIEW);
  expect(getRequestStatus("Waiting")).toBe(REQUEST_STATUSES.ACTION_NEEDED);
  expect(getRequestStatus("Done")).toBe(REQUEST_STATUSES.APPROVED);
  expect(getRequestStatus(undefined)).toBe(REQUEST_STATUSES.PENDING);
});

test("counts only unfinished requests as open and flags requests needing action", () => {
  expect(isRequestOpen("Under Review")).toBe(true);
  expect(isRequestOpen("Approved")).toBe(false);
  expect(isRequestOpen("Archived")).toBe(false);
  expect(isRequestWaiting("Not started")).toBe(true);
  expect(isRequestWaiting("Waiting")).toBe(true);
  expect(isRequestWaiting("Started")).toBe(false);
});
