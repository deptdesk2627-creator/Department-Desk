import { getProductId } from "../../../hooks/useInventoryActions";
import {
  getItemUsageType,
  PENDING_RETURN_STATUS,
  recordStatusClass,
  RETURN_DECLINED_STATUS,
} from "../../../utils/inventory";

export function formatReceiptDateOnly(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString([], {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatReceiptTimeOnly(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function hasExplicitTime(value) {
  return /[T\s]\d{2}:\d{2}/.test(String(value || ""));
}

function preferFullTimestamp(...candidates) {
  const valid = candidates.filter(Boolean);
  return valid.find(hasExplicitTime) || valid[0] || null;
}

export function computeReceiptDetails(record, inventory = [], records = []) {
  if (!record) return null;

  const allRecords = Array.isArray(records) ? records.filter(Boolean) : [];
  const matchedItem = (Array.isArray(inventory) ? inventory : []).find(
    (item) =>
      item &&
      (getProductId(item) === record.productId ||
        item.productId === record.productId ||
        item.name === record.productName),
  );

  const isPendingReturnStatus = record.status === PENDING_RETURN_STATUS;
  const isDeclinedReturnStatus = record.status === RETURN_DECLINED_STATUS;
  const isReturnedStatus = record.status === "Returned";
  const isReturnRecord =
    isReturnedStatus || isPendingReturnStatus || isDeclinedReturnStatus;

  const resolvedUsageType =
    record.usageType ||
    (record.status === "Borrowed" || isReturnRecord
      ? "Borrowable"
      : matchedItem
        ? getItemUsageType(matchedItem)
        : "Usable");

  const isBorrowable =
    resolvedUsageType === "Borrowable" ||
    record.status === "Borrowed" ||
    isReturnRecord;

  // Link Borrowed <-> Returned records
  const linkedBorrowRecord = isReturnRecord
    ? allRecords.find(
        (entry) =>
          entry.id === record.borrowRecordId ||
          (entry.productId === record.productId &&
            entry.status === "Borrowed" &&
            (!record.person ||
              !entry.person ||
              String(entry.person).toLowerCase() ===
                String(record.person).toLowerCase())),
      )
    : record.status === "Borrowed"
      ? allRecords.find((entry) => entry.id === record.id) || record
      : null;

  const matchingReturnRecords = isBorrowable
    ? allRecords.filter((entry) => {
        if (entry.status !== "Returned" || entry.productId !== record.productId) {
          return false;
        }
        if (linkedBorrowRecord && entry.borrowRecordId === linkedBorrowRecord.id) {
          return true;
        }
        if (isReturnedStatus && entry.id === record.id) {
          return true;
        }
        if (
          linkedBorrowRecord &&
          (!linkedBorrowRecord.person ||
            !entry.person ||
            String(entry.person).toLowerCase() ===
              String(linkedBorrowRecord.person).toLowerCase()) &&
          new Date(entry.dateTime).getTime() >=
            new Date(linkedBorrowRecord.dateTime).getTime()
        ) {
          return true;
        }
        return false;
      })
    : [];

  const totalBorrowedQty = isReturnRecord
    ? Number(
        record.borrowedQuantity ||
          linkedBorrowRecord?.quantity ||
          record.quantity,
      ) || 0
    : Number(record.quantity) || 0;

  const totalReturnedQty = (() => {
    if (!isBorrowable) return 0;
    if (
      isReturnRecord &&
      Number.isFinite(Number(record.cumulativeReturnedQuantity)) &&
      Number.isFinite(Number(record.borrowedQuantity))
    ) {
      return Math.min(
        totalBorrowedQty,
        Number(record.cumulativeReturnedQuantity),
      );
    }
    if (
      linkedBorrowRecord &&
      typeof linkedBorrowRecord.returnedQuantity === "number"
    ) {
      return Math.min(totalBorrowedQty, linkedBorrowRecord.returnedQuantity);
    }
    if (typeof record.cumulativeReturnedQuantity === "number") {
      return Math.min(totalBorrowedQty, record.cumulativeReturnedQuantity);
    }
    if (matchingReturnRecords.length > 0) {
      const summed = matchingReturnRecords.reduce(
        (sum, r) => sum + (Number(r.quantity) || 0),
        0,
      );
      return Math.min(totalBorrowedQty, summed);
    }
    if (record.returnedAt && !record.isPartialReturn) {
      return totalBorrowedQty;
    }
    if (isReturnedStatus && !record.isPartialReturn && !record.borrowedQuantity) {
      return totalBorrowedQty;
    }
    return 0;
  })();

  const remainingBorrowedQty = Math.max(0, totalBorrowedQty - totalReturnedQty);
  const isFullyReturned =
    isBorrowable &&
    !isPendingReturnStatus &&
    !isDeclinedReturnStatus &&
    totalBorrowedQty > 0 &&
    remainingBorrowedQty === 0;
  const isPartiallyReturned =
    isBorrowable && totalReturnedQty > 0 && remainingBorrowedQty > 0;

  const borrowedDateTime = isReturnRecord
    ? record.borrowedAt || linkedBorrowRecord?.dateTime || null
    : record.dateTime;

  const rawReturnEvents = (() => {
    const borrowEvents = Array.isArray(linkedBorrowRecord?.returnEvents)
      ? linkedBorrowRecord.returnEvents
      : [];
    const recordEvents = Array.isArray(record.returnEvents)
      ? record.returnEvents
      : [];

    if (
      borrowEvents.length > 0 &&
      borrowEvents.length >= recordEvents.length
    ) {
      return borrowEvents;
    }
    if (recordEvents.length > 0) {
      return recordEvents;
    }
    if (matchingReturnRecords.length > 0) {
      const borrowNote = String(
        record.borrowRemarks || linkedBorrowRecord?.remarks || "",
      )
        .trim()
        .toLowerCase();
      return [...matchingReturnRecords]
        .sort(
          (a, b) =>
            new Date(a.dateTime || 0).getTime() -
              new Date(b.dateTime || 0).getTime() ||
            Number(a.id || 0) - Number(b.id || 0),
        )
        .map((r) => {
          const candidateRemark = String(r.returnRemarks ?? r.remarks ?? "").trim();
          const cleanedRemark =
            borrowNote && candidateRemark.toLowerCase() === borrowNote
              ? ""
              : candidateRemark;
          return {
            id: r.id,
            dateTime: r.dateTime,
            quantity: r.quantity,
            person: r.person,
            returnedBy: r.returnedBy || r.person,
            remarks: cleanedRemark,
          };
        });
    }
    return [];
  })();

  let runningRemaining = totalBorrowedQty;
  const returnEvents = rawReturnEvents.map((batch, index) => {
    const qty = Number(batch.quantity) || 0;
    runningRemaining = Math.max(0, runningRemaining - qty);
    const borrowNote = String(
      record.borrowRemarks || linkedBorrowRecord?.remarks || "",
    )
      .trim()
      .toLowerCase();
    const rawBatchRemark = String(batch.remarks || "").trim();
    const cleanBatchRemark =
      borrowNote && rawBatchRemark.toLowerCase() === borrowNote
        ? ""
        : rawBatchRemark;
    return {
      ...batch,
      remarks: cleanBatchRemark,
      batchNumber: index + 1,
      remainingAfter:
        typeof batch.remainingAfter === "number"
          ? batch.remainingAfter
          : runningRemaining,
    };
  });

  // ONLY populate the final Date & Time Returned when 100% of the borrowed quantity has been confirmed returned!
  const latestBatchDateTime =
    returnEvents.length > 0
      ? returnEvents[returnEvents.length - 1]?.dateTime
      : null;
  const completedReturnDateTime = isFullyReturned
    ? preferFullTimestamp(
        isReturnedStatus ? record.confirmedAt : null,
        isReturnedStatus ? record.returnedAt : null,
        isReturnedStatus ? record.dateTime : null,
        latestBatchDateTime,
        linkedBorrowRecord?.returnedAt,
        matchingReturnRecords[0]?.dateTime,
        record.returnedAt,
      )
    : null;

  const latestRepresentative =
    record.returnedBy ||
    returnEvents[returnEvents.length - 1]?.returnedBy ||
    "";

  const borrowerAccountName =
    record.person || linkedBorrowRecord?.person || "Office Personnel";

  const hasDifferentRepresentative =
    Boolean(latestRepresentative) &&
    latestRepresentative.toLowerCase() !== borrowerAccountName.toLowerCase();

  const primaryRemark = isReturnRecord
    ? record.borrowRemarks ||
      linkedBorrowRecord?.remarks ||
      record.remarks ||
      ""
    : record.remarks || "";

  const normalizedBorrowRemark = String(primaryRemark || "")
    .trim()
    .toLowerCase();
  const rawReturnConditionNote = isReturnRecord
    ? record.returnRemarks || record.remarks || ""
    : linkedBorrowRecord?.returnRemarks ||
      record.returnRemarks ||
      returnEvents[returnEvents.length - 1]?.remarks ||
      "";
  const returnConditionNote =
    normalizedBorrowRemark &&
    String(rawReturnConditionNote).trim().toLowerCase() ===
      normalizedBorrowRemark
      ? ""
      : rawReturnConditionNote;

  const remarksHeading = isBorrowable
    ? "Remark / Reason for Borrowing"
    : "Remark / Purpose of Request";

  const statusPillLabel = isPendingReturnStatus
    ? `Pending Confirmation (${record.quantity} ${record.unit})`
    : isDeclinedReturnStatus
      ? "Return Declined"
      : isPartiallyReturned
        ? `Partially Returned (${totalReturnedQty}/${totalBorrowedQty})`
        : isFullyReturned
          ? record.status === "Borrowed"
            ? `Borrowed · Returned (${totalReturnedQty}/${totalBorrowedQty})`
            : `Returned (${totalReturnedQty}/${totalBorrowedQty})`
          : record.status;

  const statusPillVariant = isPendingReturnStatus
    ? "status-pending"
    : isDeclinedReturnStatus
      ? "status-action-needed"
      : isPartiallyReturned
        ? "status-waiting"
        : isFullyReturned
          ? recordStatusClass("Returned")
          : recordStatusClass(record.status);

  return {
    isBorrowable,
    isReturnedStatus,
    isPendingReturnStatus,
    isDeclinedReturnStatus,
    borrowedDateTime,
    completedReturnDateTime,
    totalBorrowedQty,
    totalReturnedQty,
    remainingBorrowedQty,
    isFullyReturned,
    isPartiallyReturned,
    returnEvents,
    latestRepresentative,
    borrowerAccountName,
    hasDifferentRepresentative,
    primaryRemark,
    returnConditionNote,
    remarksHeading,
    statusPillLabel,
    statusPillVariant,
    receivedBy: record.receivedBy || "",
  };
}
