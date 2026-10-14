export const REQUEST_STATUSES = Object.freeze({
  PENDING: "Pending",
  UNDER_REVIEW: "Under Review",
  ACTION_NEEDED: "Action Needed",
  APPROVED: "Approved",
  ARCHIVED: "Archived",
});

const legacyStatuses = {
  "Not started": REQUEST_STATUSES.PENDING,
  Started: REQUEST_STATUSES.UNDER_REVIEW,
  Waiting: REQUEST_STATUSES.ACTION_NEEDED,
  Done: REQUEST_STATUSES.APPROVED,
};

export function getRequestStatus(status) {
  if (typeof status !== "string") return REQUEST_STATUSES.PENDING;
  return Object.prototype.hasOwnProperty.call(legacyStatuses, status)
    ? legacyStatuses[status]
    : status || REQUEST_STATUSES.PENDING;
}

export function isRequestOpen(status) {
  const normalizedStatus = getRequestStatus(status);
  return (
    normalizedStatus !== REQUEST_STATUSES.APPROVED &&
    normalizedStatus !== REQUEST_STATUSES.ARCHIVED
  );
}

export function isRequestWaiting(status) {
  const normalizedStatus = getRequestStatus(status);
  return (
    normalizedStatus === REQUEST_STATUSES.PENDING ||
    normalizedStatus === REQUEST_STATUSES.ACTION_NEEDED
  );
}
