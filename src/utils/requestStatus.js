const legacyStatuses = {
  "Not started": "Pending",
  Started: "Under Review",
  Waiting: "Action Needed",
  Done: "Approved",
};

export function getRequestStatus(status) {
  if (typeof status !== "string") return "Pending";
  return Object.prototype.hasOwnProperty.call(legacyStatuses, status)
    ? legacyStatuses[status]
    : status || "Pending";
}

export function isRequestOpen(status) {
  const normalizedStatus = getRequestStatus(status);
  return normalizedStatus !== "Approved" && normalizedStatus !== "Archived";
}

export function isRequestWaiting(status) {
  const normalizedStatus = getRequestStatus(status);
  return normalizedStatus === "Pending" || normalizedStatus === "Action Needed";
}
