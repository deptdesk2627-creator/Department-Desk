export const REQUEST_STATUSES = Object.freeze({
  PENDING: "Pending",
  UNDER_REVIEW: "Under Review",
  ACTION_NEEDED: "Action Needed",
  APPROVED: "Approved",
  ARCHIVED: "Archived",
});

export const INCOMING_REQUEST_STATUSES = Object.freeze({
  RECEIVED: "Received",
  FOR_SIGNATURE: "For Signature",
  SIGNED_BY_OFFICE: "Signed by Office",
  SENT_OUT: "Sent Out",
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
    normalizedStatus !== INCOMING_REQUEST_STATUSES.SENT_OUT &&
    normalizedStatus !== REQUEST_STATUSES.ARCHIVED
  );
}

export function isRequestWaiting(status) {
  const normalizedStatus = getRequestStatus(status);
  return (
    normalizedStatus === REQUEST_STATUSES.PENDING ||
    normalizedStatus === REQUEST_STATUSES.ACTION_NEEDED ||
    normalizedStatus === INCOMING_REQUEST_STATUSES.RECEIVED ||
    normalizedStatus === INCOMING_REQUEST_STATUSES.FOR_SIGNATURE
  );
}
