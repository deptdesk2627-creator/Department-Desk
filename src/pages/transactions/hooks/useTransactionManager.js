import { useEffect, useMemo, useState } from "react";
import { getRequestStatus } from "../../../constants/requestStatus";
import { formatDate } from "../../../utils/formatters";
import { matchesQuery } from "../../../utils/search";
import {
  outgoingStatuses,
  incomingStatuses,
  offices,
  categories,
  signatureOptions,
  forwardedDestinations,
  emptyForm,
} from "../constants";
import {
  statusClass,
  requestName,
  requestOffice,
  requestCategory,
  requestDirection,
  exportRequest,
  updateRequestStatus,
  applyIncomingChanges,
  buildRequestTrail,
} from "../utils/transactionHelpers";

export function useTransactionManager({ requests, setRequests, search }) {
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const requestedTab = window.sessionStorage.getItem(
          "officeflow.transactions-tab",
        );
        if (requestedTab) {
          window.sessionStorage.removeItem("officeflow.transactions-tab");
          return requestedTab === "incoming" ? "incoming" : "outgoing";
        }
      }
    } catch {
      // Ignore storage errors
    }
    return "outgoing";
  });
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

  const requestTrail = buildRequestTrail(selectedTransaction);

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
