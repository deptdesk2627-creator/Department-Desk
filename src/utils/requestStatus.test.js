import {
  getRequestStatus,
  isRequestOpen,
  isRequestWaiting,
} from "./requestStatus";

test("maps legacy request statuses to the current workflow", () => {
  expect(getRequestStatus("Not started")).toBe("Pending");
  expect(getRequestStatus("Started")).toBe("Under Review");
  expect(getRequestStatus("Waiting")).toBe("Action Needed");
  expect(getRequestStatus("Done")).toBe("Approved");
  expect(getRequestStatus(undefined)).toBe("Pending");
});

test("counts only unfinished requests as open and flags requests needing action", () => {
  expect(isRequestOpen("Under Review")).toBe(true);
  expect(isRequestOpen("Approved")).toBe(false);
  expect(isRequestOpen("Archived")).toBe(false);
  expect(isRequestWaiting("Not started")).toBe(true);
  expect(isRequestWaiting("Waiting")).toBe(true);
  expect(isRequestWaiting("Started")).toBe(false);
});
