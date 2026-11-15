import { useEffect, useMemo, useState } from "react";
import { getRequestStatus } from "../../../constants/requestStatus";
import { formatDate } from "../../../utils/formatters";
import { matchesQuery } from "../../../utils/search";
import {
  outgoingStatuses,
  incomingStatuses,
  offices as defaultOffices,
  categories,
  signatureOptions,
  forwardedDestinations as defaultForwardedDestinations,
  cabinetGroups,
  cabinetLocations,
  UNFILED_LOCATION,
  emptyForm,
} from "../constants";
import {
  statusClass,
  requestName,
  requestOffice,
  requestCategory,
  requestDirection,
  requestFileLocation,
  exportRequest,
  updateRequestStatus,
  updateRequestFileLocation,
  applyIncomingChanges,
  buildRequestTrail,
} from "../utils/transactionHelpers";

export function useTransactionManager({
  requests,
  setRequests,
  search,
  defaultView = "table",
  officeOptions = defaultOffices,
  forwardedOptions = defaultForwardedDestinations,
  onRequestAdd,
  onRequestUpdate,
  onRequestDelete,
  onRequestError,
}) {
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
  const [cabinetFilter, setCabinetFilter] = useState("All Cabinets");
  const [requestSearch, setRequestSearch] = useState("");
  const [formError, setFormError] = useState("");
  const [view, setView] = useState(() =>
    ["table", "board", "cabinets"].includes(defaultView) ? defaultView : "table",
  );
  const [form, setForm] = useState(() => emptyForm("outgoing"));

  useEffect(() => {
    if (!officeOptions.length) return;
    setForm((current) =>
      officeOptions.some(
        (office) =>
          String(office).trim().toLowerCase() ===
          String(current.office).trim().toLowerCase(),
      )
        ? current
        : { ...current, office: officeOptions[0] },
    );
  }, [form.office, officeOptions]);

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
      const fileLocation = requestFileLocation(request);

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
      const matchesCabinet =
        cabinetFilter === "All Cabinets" ||
        cabinetFilter === "All" ||
        fileLocation === cabinetFilter ||
        fileLocation.startsWith(`${cabinetFilter} - `);

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
        fileLocation,
        request.dateTime,
      ];
      return (
        matchesStatus &&
        matchesOffice &&
        matchesCategory &&
        matchesCabinet &&
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
    cabinetFilter,
  ]);

  const hasActiveFilters = Boolean(
    requestSearch.trim() ||
      (activeFilter !== "All Requests" && activeFilter !== "All") ||
      (officeFilter !== "All Offices" && officeFilter !== "All") ||
      (categoryFilter !== "All Categories" && categoryFilter !== "All") ||
      (cabinetFilter !== "All Cabinets" && cabinetFilter !== "All"),
  );

  function resetFilters() {
    setActiveFilter("All Requests");
    setOfficeFilter("All Offices");
    setCategoryFilter("All Categories");
    setCabinetFilter("All Cabinets");
    setRequestSearch("");
  }

  function appendRequest(request) {
    setRequests((current) => {
      const currentRequests = Array.isArray(current) ? current : [];
      const baseId = request.id;
      let id = baseId;
      let suffix = 1;
      const existingIds = new Set(
        currentRequests
          .filter(
            (item) => requestDirection(item) === requestDirection(request),
          )
          .map((item) => item?.id),
      );
      while (existingIds.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }
      return [{ ...request, id }, ...currentRequests];
    });
  }

  function persistUpdatedRequest(previous, updated) {
    if (!onRequestUpdate) return;
    Promise.resolve()
      .then(() => onRequestUpdate(previous, updated))
      .catch((error) => {
        setRequests((current) =>
          (Array.isArray(current) ? current : []).map((request) =>
            request?.id === previous.id &&
            requestDirection(request) === requestDirection(previous)
              ? previous
              : request,
          ),
        );
        setSelectedTransaction((current) =>
          current?.id === previous.id &&
          requestDirection(current) === requestDirection(previous)
            ? previous
            : current,
        );
        onRequestError?.("update", error);
      });
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
    const resolvedFileLocation = form.fileLocation || UNFILED_LOCATION;

    const nowIso = new Date().toISOString();
    const initialHistory = [
      {
        status: resolvedStatus,
        location: isIncoming
          ? resolvedForwarded && resolvedForwarded !== "Not sent out"
            ? `${form.office} → ${resolvedForwarded}`
            : `From ${form.office}`
          : form.office,
        dateTime: nowIso,
      },
      ...(resolvedFileLocation !== UNFILED_LOCATION
        ? [
            {
              status: "Filed in Cabinet",
              location: resolvedFileLocation,
              dateTime: nowIso,
            },
          ]
        : []),
    ];

    const request = {
      ...form,
      direction: isIncoming ? "incoming" : "outgoing",
      status: resolvedStatus,
      fileLocation: resolvedFileLocation,
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
    if (!onRequestAdd) {
      appendRequest(request);
      setForm(emptyForm(isIncoming ? "incoming" : "outgoing"));
      return true;
    }

    return Promise.resolve(onRequestAdd(request))
      .then((savedRequest) => {
        appendRequest(savedRequest);
        setForm(emptyForm(isIncoming ? "incoming" : "outgoing"));
        return true;
      })
      .catch((error) => {
        setFormError(error.message || "Could not save this transaction.");
        onRequestError?.("create", error);
        return false;
      });
  }

  function updateStatus(id, status) {
    const request = allRequestItems.find(
      (item) => item.id === id && requestDirection(item) === activeTab,
    );
    if (!request) return;
    const updatedRequest = updateRequestStatus(request, status);
    setRequests((current) =>
      (Array.isArray(current) ? current : []).map((request) =>
        request?.id === id && requestDirection(request) === activeTab
          ? updatedRequest
          : request,
      ),
    );
    setSelectedTransaction((current) =>
      current?.id === id && requestDirection(current) === activeTab
        ? updatedRequest
        : current,
    );
    persistUpdatedRequest(request, updatedRequest);
  }

  function updateIncomingRequest(id, changes) {
    const request = allRequestItems.find(
      (item) => item.id === id && requestDirection(item) === "incoming",
    );
    if (!request) return;
    const updatedRequest = applyIncomingChanges(request, changes);
    setRequests((current) =>
      (Array.isArray(current) ? current : []).map((request) =>
        request?.id === id && requestDirection(request) === "incoming"
          ? updatedRequest
          : request,
      ),
    );
    setSelectedTransaction((current) =>
      current?.id === id && requestDirection(current) === "incoming"
        ? updatedRequest
        : current,
    );
    persistUpdatedRequest(request, updatedRequest);
  }

  function updateFileLocation(id, fileLocation) {
    const request = allRequestItems.find(
      (item) => item.id === id && requestDirection(item) === activeTab,
    );
    if (!request) return;
    const updatedRequest = updateRequestFileLocation(request, fileLocation);
    setRequests((current) =>
      (Array.isArray(current) ? current : []).map((request) =>
        request?.id === id && requestDirection(request) === activeTab
          ? updatedRequest
          : request,
      ),
    );
    setSelectedTransaction((current) =>
      current?.id === id && requestDirection(current) === activeTab
        ? updatedRequest
        : current,
    );
    persistUpdatedRequest(request, updatedRequest);
  }

  function deleteRequest(id) {
    const request = allRequestItems.find(
      (item) => item.id === id && requestDirection(item) === activeTab,
    );
    if (!request) return;
    setRequests((current) =>
      (Array.isArray(current) ? current : []).filter(
        (item) => item?.id !== id || requestDirection(item) !== activeTab,
      ),
    );
    if (
      selectedTransaction?.id === id &&
      requestDirection(selectedTransaction) === activeTab
    ) {
      setSelectedTransaction(null);
    }
    if (onRequestDelete) {
      Promise.resolve()
        .then(() => onRequestDelete(request))
        .catch((error) => {
          setRequests((current) => {
            const currentRequests = Array.isArray(current) ? current : [];
            const alreadyPresent = currentRequests.some(
              (item) =>
                item?.id === request.id &&
                requestDirection(item) === requestDirection(request),
            );
            return alreadyPresent
              ? currentRequests
              : [request, ...currentRequests];
          });
          onRequestError?.("delete", error);
        });
    }
  }

  const requestTrail = buildRequestTrail(selectedTransaction);

  return {
    activeFilter,
    activeTab,
    addRequest,
    cabinetFilter,
    cabinetGroups,
    cabinetLocations,
    categories,
    categoryFilter,
    deleteRequest,
    exportRequest,
    filters,
    form,
    formError,
    forwardedDestinations: forwardedOptions,
    hasActiveFilters,
    incomingCount: incomingRequests.length,
    incomingStatuses,
    officeFilter,
    offices: officeOptions,
    outgoingCount: outgoingRequests.length,
    outgoingStatuses,
    requestCategory,
    requestDirection,
    requestFileLocation,
    requestName,
    requestOffice,
    requestSearch,
    requestTrail,
    resetFilters,
    selectedTransaction,
    setActiveFilter,
    setActiveTab,
    setCabinetFilter,
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
    updateFileLocation,
    updateIncomingRequest,
    updateStatus,
    view,
    visibleRequests,
    formatDate,
    getRequestStatus,
  };
}
