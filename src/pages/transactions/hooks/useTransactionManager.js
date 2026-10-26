import { useEffect, useMemo, useState } from "react";
import { getRequestStatus } from "../../../constants/requestStatus";
import { formatDate, formatDateTime } from "../../../utils/formatters";
import { matchesQuery } from "../../../utils/search";

const outgoingStatuses = [
  "Pending",
  "Under Review",
  "Action Needed",
  "Approved",
  "Archived",
];
const incomingStatuses = [
  "Received",
  "For Signature",
  "Signed by Office",
  "Sent Out",
  "Archived",
];
const offices = [
  "Registrar",
  "Office of the President",
  "Dean's Office",
  "Secretary's Office",
  "Finance Office",
  "Facilities Office",
  "HR Office",
  "Other",
];
const categories = ["Document", "Request"];
const signatureOptions = [
  "Unsigned",
  "Signed by Secretary",
  "Signed by Dean",
  "Signed by Both",
];
const forwardedDestinations = [
  "Not sent out",
  "Returned to Sender",
  ...offices,
];

const emptyForm = (direction = "outgoing") => ({
  direction,
  dateTime: new Date().toISOString().slice(0, 16),
  description: "",
  document: "",
  student: "",
  office: "Registrar",
  type: "Document",
  status: direction === "incoming" ? "Received" : "Pending",
  signedByOffice: "Unsigned",
  forwardedTo: "Not sent out",
});

function statusClass(status) {
  const normalized = getRequestStatus(status);
  if (normalized === "Received") return "status-pending";
  if (normalized === "For Signature") return "status-action-needed";
  if (normalized === "Signed by Office") return "status-under-review";
  if (normalized === "Sent Out") return "status-approved";
  return `status-${normalized.toLowerCase().replaceAll(" ", "-")}`;
}

function requestName(request) {
  return request.document || request.description || "Untitled request";
}

function requestOffice(request) {
  return request.office || request.location || "—";
}

function requestCategory(request) {
  return request.category || request.type || "Request";
}

function requestDirection(request) {
  return request?.direction === "incoming" ? "incoming" : "outgoing";
}

function csvValue(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}

export function useTransactionManager({ requests, setRequests, search }) {
  const [activeTab, setActiveTabState] = useState("outgoing");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All Requests");
  const [officeFilter, setOfficeFilter] = useState("All Offices");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [requestSearch, setRequestSearch] = useState("");
  const [formError, setFormError] = useState("");
  const [view, setView] = useState("table");
  const [form, setForm] = useState(() => emptyForm("outgoing"));

  const statuses =
    activeTab === "incoming" ? incomingStatuses : outgoingStatuses;
  const filters = useMemo(() => ["All Requests", ...statuses], [statuses]);

  function setActiveTab(nextTab) {
    const resolvedTab = nextTab === "incoming" ? "incoming" : "outgoing";
    setActiveTabState(resolvedTab);
    setActiveFilter("All Requests");
    setForm((current) => ({
      ...current,
      direction: resolvedTab,
      status:
        resolvedTab === "incoming"
          ? incomingStatuses.includes(current.status)
            ? current.status
            : "Received"
          : outgoingStatuses.includes(current.status)
            ? current.status
            : "Pending",
    }));
  }

  useEffect(() => {
    if (!selectedTransaction) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") setSelectedTransaction(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedTransaction]);

  const allRequestItems = useMemo(
    () => (Array.isArray(requests) ? requests.filter(Boolean) : []),
    [requests],
  );

  const outgoingRequests = useMemo(
    () =>
      allRequestItems.filter(
        (request) => requestDirection(request) === "outgoing",
      ),
    [allRequestItems],
  );

  const incomingRequests = useMemo(
    () =>
      allRequestItems.filter(
        (request) => requestDirection(request) === "incoming",
      ),
    [allRequestItems],
  );

  const tabRequests =
    activeTab === "incoming" ? incomingRequests : outgoingRequests;

  const visibleRequests = useMemo(() => {
    return tabRequests.filter((request) => {
      const normalizedStatus = getRequestStatus(request.status);
      const office = requestOffice(request);
      const category = requestCategory(request);

      const matchesStatus =
        activeFilter === "All Requests" ||
        activeFilter === "All" ||
        normalizedStatus === activeFilter;
      const matchesOffice =
        officeFilter === "All Offices" ||
        officeFilter === "All" ||
        office === officeFilter;
      const matchesCategory =
        categoryFilter === "All Categories" ||
        categoryFilter === "All" ||
        category === categoryFilter;

      const searchableValues = [
        request.id,
        request.student,
        requestName(request),
        request.description,
        request.notes,
        office,
        category,
        normalizedStatus,
        request.signedByOffice,
        request.forwardedTo,
        request.dateTime,
      ];
      return (
        matchesStatus &&
        matchesOffice &&
        matchesCategory &&
        matchesQuery(search, ...searchableValues) &&
        matchesQuery(requestSearch, ...searchableValues)
      );
    });
  }, [
    tabRequests,
    search,
    requestSearch,
    activeFilter,
    officeFilter,
    categoryFilter,
  ]);

  const hasActiveFilters = Boolean(
    requestSearch.trim() ||
      (activeFilter !== "All Requests" && activeFilter !== "All") ||
      (officeFilter !== "All Offices" && officeFilter !== "All") ||
      (categoryFilter !== "All Categories" && categoryFilter !== "All"),
  );

  function resetFilters() {
    setActiveFilter("All Requests");
    setOfficeFilter("All Offices");
    setCategoryFilter("All Categories");
    setRequestSearch("");
  }

  function addRequest(event) {
    event.preventDefault();
    if (!form.student.trim() || !form.document.trim()) {
      setFormError("Enter a requester and form name before adding the request.");
      return false;
    }
    setFormError("");
    const submittedAt = Date.now();
    const isIncoming = form.direction === "incoming";
    const prefix = isIncoming ? "INC" : "REQ";
    const resolvedStatus = getRequestStatus(
      form.status || (isIncoming ? "Received" : "Pending"),
    );
    const resolvedSigned = isIncoming
      ? form.signedByOffice || "Unsigned"
      : undefined;
    const resolvedForwarded = isIncoming
      ? form.forwardedTo || "Not sent out"
      : undefined;

    const initialHistory = [
      {
        status: resolvedStatus,
        location: isIncoming
          ? resolvedForwarded && resolvedForwarded !== "Not sent out"
            ? `${form.office} → ${resolvedForwarded}`
            : `From ${form.office}`
          : form.office,
        dateTime: new Date().toISOString(),
      },
    ];

    const request = {
      ...form,
      direction: isIncoming ? "incoming" : "outgoing",
      status: resolvedStatus,
      ...(isIncoming
        ? {
            signedByOffice: resolvedSigned,
            forwardedTo: resolvedForwarded,
          }
        : {}),
      id: `${prefix}-${new Date(submittedAt).getFullYear()}-${submittedAt.toString().slice(-6)}`,
      location: form.office,
      notes: form.description,
      history: initialHistory,
    };
    setRequests((current) => {
      const currentRequests = Array.isArray(current) ? current : [];
      const baseId = request.id;
      let id = baseId;
      let suffix = 1;
      const existingIds = new Set(currentRequests.map((item) => item?.id));
      while (existingIds.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }
      return [{ ...request, id }, ...currentRequests];
    });
    setForm(emptyForm(isIncoming ? "incoming" : "outgoing"));
    return true;
  }

  function updateRequestStatus(request, status) {
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

  function updateStatus(id, status) {
    setRequests((current) =>
      (Array.isArray(current) ? current : []).map((request) =>
        request?.id === id ? updateRequestStatus(request, status) : request,
      ),
    );
    setSelectedTransaction((current) =>
      current?.id === id ? updateRequestStatus(current, status) : current,
    );
  }

  function applyIncomingChanges(request, changes) {
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

  function updateIncomingRequest(id, changes) {
    setRequests((current) =>
      (Array.isArray(current) ? current : []).map((request) =>
        request?.id === id ? applyIncomingChanges(request, changes) : request,
      ),
    );
    setSelectedTransaction((current) =>
      current?.id === id ? applyIncomingChanges(current, changes) : current,
    );
  }

  function deleteRequest(id) {
    setRequests((current) =>
      (Array.isArray(current) ? current : []).filter(
        (request) => request?.id !== id,
      ),
    );
    if (selectedTransaction?.id === id) setSelectedTransaction(null);
  }

  function exportRequest(request) {
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

  const requestTrail = selectedTransaction
    ? [
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
      ]
    : [];

  return {
    activeFilter,
    activeTab,
    addRequest,
    categories,
    categoryFilter,
    deleteRequest,
    exportRequest,
    filters,
    form,
    formError,
    forwardedDestinations,
    hasActiveFilters,
    incomingCount: incomingRequests.length,
    incomingStatuses,
    officeFilter,
    offices,
    outgoingCount: outgoingRequests.length,
    outgoingStatuses,
    requestCategory,
    requestDirection,
    requestName,
    requestOffice,
    requestSearch,
    requestTrail,
    resetFilters,
    selectedTransaction,
    setActiveFilter,
    setActiveTab,
    setCategoryFilter,
    setForm,
    setOfficeFilter,
    setRequestSearch,
    setSelectedTransaction,
    setView,
    signatureOptions,
    statusClass,
    statuses,
    tabTotalRequests: tabRequests.length,
    updateIncomingRequest,
    updateStatus,
    view,
    visibleRequests,
    formatDate,
    getRequestStatus,
  };
}
