import { useEffect, useMemo, useState } from "react";
import { getRequestStatus } from "../../../constants/requestStatus";
import { formatDate, formatDateTime } from "../../../utils/formatters";
import { matchesQuery } from "../../../utils/search";

const statuses = ["Pending", "Under Review", "Action Needed", "Approved", "Archived"];
const filters = ["All Requests", ...statuses];
const offices = ["Registrar", "Office of the President", "Dean's Office", "Secretary's Office", "Finance Office", "Facilities Office", "HR Office", "Other"];
const categories = ["Document", "Request"];
const emptyForm = () => ({
  dateTime: new Date().toISOString().slice(0, 16),
  description: "",
  document: "",
  student: "",
  office: "Registrar",
  type: "Document",
  status: "Pending",
});

function statusClass(status) {
  return `status-${getRequestStatus(status).toLowerCase().replaceAll(" ", "-")}`;
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

function csvValue(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}

export function useTransactionManager({ requests, setRequests, search }) {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All Requests");
  const [requestSearch, setRequestSearch] = useState("");
  const [formError, setFormError] = useState("");
  const [view, setView] = useState("table");
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!selectedTransaction) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") setSelectedTransaction(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedTransaction]);

  const visibleRequests = useMemo(() => {
    const requestItems = Array.isArray(requests) ? requests.filter(Boolean) : [];
    return requestItems.filter((request) => {
      const normalizedStatus = getRequestStatus(request.status);
      const matchesFilter =
        activeFilter === "All Requests" || normalizedStatus === activeFilter;
      const searchableValues = [
        request.id,
        request.student,
        requestName(request),
        request.description,
        request.notes,
        requestOffice(request),
        requestCategory(request),
        normalizedStatus,
        request.dateTime,
      ];
      return (
        matchesFilter &&
        matchesQuery(search, ...searchableValues) &&
        matchesQuery(requestSearch, ...searchableValues)
      );
    });
  }, [requests, search, requestSearch, activeFilter]);

  function addRequest(event) {
    event.preventDefault();
    if (!form.student.trim() || !form.document.trim()) {
      setFormError("Enter a requester and form name before adding the request.");
      return false;
    }
    setFormError("");
    const submittedAt = Date.now();
    const request = {
      ...form,
      id: `REQ-${new Date(submittedAt).getFullYear()}-${submittedAt.toString().slice(-6)}`,
      location: form.office,
      notes: form.description,
      history: [
        {
          status: getRequestStatus(form.status),
          location: form.office,
          dateTime: new Date().toISOString(),
        },
      ],
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
    setForm(emptyForm());
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

  function deleteRequest(id) {
    setRequests((current) =>
      (Array.isArray(current) ? current : []).filter(
        (request) => request?.id !== id,
      ),
    );
    if (selectedTransaction?.id === id) setSelectedTransaction(null);
  }

  function exportRequest(request) {
    const headings = [
      "Request ID",
      "Form Name",
      "Requested By",
      "Office",
      "Date Submitted",
      "Category",
      "Status",
      "Request Notes",
    ];
    const values = [
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
        { title: "Form Submitted", dateTime: selectedTransaction.dateTime },
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
    addRequest,
    categories,
    deleteRequest,
    exportRequest,
    filters,
    form,
    formError,
    offices,
    requestCategory,
    requestName,
    requestOffice,
    requestSearch,
    requestTrail,
    selectedTransaction,
    setActiveFilter,
    setForm,
    setRequestSearch,
    setSelectedTransaction,
    setView,
    statusClass,
    statuses,
    updateStatus,
    view,
    visibleRequests,
    formatDate,
    getRequestStatus,
  };
}
