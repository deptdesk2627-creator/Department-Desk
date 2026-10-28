import { getRequestStatus } from "../../../constants/requestStatus";
import { formatDateTime } from "../../../utils/formatters";

export function statusClass(status) {
  const normalized = getRequestStatus(status);
  if (normalized === "Received") return "status-pending";
  if (normalized === "For Signature") return "status-action-needed";
  if (normalized === "Signed by Office") return "status-under-review";
  if (normalized === "Sent Out") return "status-approved";
  return `status-${normalized.toLowerCase().replaceAll(" ", "-")}`;
}

export function requestName(request) {
  return request?.document || request?.description || "Untitled request";
}

export function requestOffice(request) {
  return request?.office || request?.location || "—";
}

export function requestCategory(request) {
  return request?.category || request?.type || "Request";
}

export function requestDirection(request) {
  return request?.direction === "incoming" ? "incoming" : "outgoing";
}

export function csvValue(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}

export function exportRequest(request) {
  const isIncoming = requestDirection(request) === "incoming";
  const headings = isIncoming
    ? [
        "Document ID",
        "Document Name",
        "Sender / Requested By",
        "From Office",
        "Date Received",
        "Category",
        "Our Office Signature",
        "Sent Out To",
        "Status",
        "Notes",
      ]
    : [
        "Request ID",
        "Form Name",
        "Requested By",
        "Office",
        "Date Submitted",
        "Category",
        "Status",
        "Request Notes",
      ];
  const values = isIncoming
    ? [
        request.id,
        requestName(request),
        request.student,
        requestOffice(request),
        formatDateTime(request.dateTime),
        requestCategory(request),
        request.signedByOffice || "Unsigned",
        request.forwardedTo || "Not sent out",
        getRequestStatus(request.status),
        request.notes || request.description,
      ]
    : [
        request.id,
        requestName(request),
        request.student,
        requestOffice(request),
        formatDateTime(request.dateTime),
        requestCategory(request),
        getRequestStatus(request.status),
        request.notes || request.description,
      ];
  const blob = new Blob(
    [[headings, values].map((row) => row.map(csvValue).join(",")).join("\r\n")],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${String(request.id || "request").replace(/[^a-z0-9-_]/gi, "_")}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function updateRequestStatus(request, status) {
  const nextStatus = getRequestStatus(status);
  const nextLocation = request.office || request.location || "—";
  const history = Array.isArray(request.history) ? [...request.history] : [];
  const lastEntry = history[history.length - 1];
  if (
    !lastEntry ||
    lastEntry.status !== nextStatus ||
    lastEntry.location !== nextLocation
  ) {
    history.push({
      status: nextStatus,
      location: nextLocation,
      dateTime: new Date().toISOString(),
    });
  }
  return {
    ...request,
    status: nextStatus,
    office: nextLocation,
    location: nextLocation,
    history,
  };
}

export function applyIncomingChanges(request, changes) {
  const nextSigned =
    changes.signedByOffice !== undefined
      ? changes.signedByOffice
      : request.signedByOffice || "Unsigned";
  const nextForwarded =
    changes.forwardedTo !== undefined
      ? changes.forwardedTo
      : request.forwardedTo || "Not sent out";
  let nextStatus =
    changes.status !== undefined
      ? getRequestStatus(changes.status)
      : getRequestStatus(request.status);

  const history = Array.isArray(request.history) ? [...request.history] : [];

  if (
    changes.signedByOffice !== undefined &&
    changes.signedByOffice !== request.signedByOffice
  ) {
    if (
      changes.signedByOffice !== "Unsigned" &&
      (nextStatus === "Received" || nextStatus === "For Signature")
    ) {
      nextStatus = "Signed by Office";
    }
    history.push({
      status: changes.signedByOffice,
      location: "Our Office",
      dateTime: new Date().toISOString(),
    });
  }

  if (
    changes.forwardedTo !== undefined &&
    changes.forwardedTo !== request.forwardedTo
  ) {
    if (changes.forwardedTo !== "Not sent out") {
      nextStatus = "Sent Out";
      history.push({
        status: "Sent Out",
        location: `Sent to ${changes.forwardedTo}`,
        dateTime: new Date().toISOString(),
      });
    }
  }

  return {
    ...request,
    status: nextStatus,
    signedByOffice: nextSigned,
    forwardedTo: nextForwarded,
    history,
  };
}

export function buildRequestTrail(selectedTransaction) {
  if (!selectedTransaction) return [];
  return [
    {
      title:
        requestDirection(selectedTransaction) === "incoming"
          ? "Document Received"
          : "Form Submitted",
      dateTime: selectedTransaction.dateTime,
      office:
        requestDirection(selectedTransaction) === "incoming"
          ? `From ${requestOffice(selectedTransaction)}`
          : undefined,
    },
    ...(Array.isArray(selectedTransaction.history)
      ? selectedTransaction.history.filter(Boolean)
      : []
    ).map((item) => ({
      title: getRequestStatus(item.status),
      dateTime: item.dateTime,
      office: item.location,
    })),
  ];
}
