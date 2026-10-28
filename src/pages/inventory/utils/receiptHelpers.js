import { getProductId } from "../../../hooks/useInventoryActions";
import { getItemUsageType, recordStatusClass } from "../../../utils/inventory";

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

  const resolvedUsageType =
    record.usageType ||
    (record.status === "Borrowed" || record.status === "Returned"
      ? "Borrowable"
      : matchedItem
        ? getItemUsageType(matchedItem)
        : "Usable");

  const isBorrowable =
    resolvedUsageType === "Borrowable" ||
    record.status === "Borrowed" ||
    record.status === "Returned";

  const isReturnedStatus = record.status === "Returned";

  // Link Borrowed <-> Returned records
  const linkedBorrowRecord = isReturnedStatus
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

  const totalBorrowedQty = isReturnedStatus
    ? Number(
        record.borrowedQuantity ||
          linkedBorrowRecord?.quantity ||
          record.quantity,
      ) || 0
    : Number(record.quantity) || 0;

  const totalReturnedQty = (() => {
    if (!isBorrowable) return 0;
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
    isBorrowable && totalBorrowedQty > 0 && remainingBorrowedQty === 0;
  const isPartiallyReturned =
    isBorrowable && totalReturnedQty > 0 && remainingBorrowedQty > 0;

  const borrowedDateTime = isReturnedStatus
    ? record.borrowedAt || linkedBorrowRecord?.dateTime || null
    : record.dateTime;

  // ONLY populate the final Date & Time Returned when 100% of the borrowed quantity has been returned!
  const completedReturnDateTime = isFullyReturned
    ? (isReturnedStatus
        ? record.returnedAt || record.dateTime
        : linkedBorrowRecord?.returnedAt ||
          record.returnedAt ||
          matchingReturnRecords[0]?.dateTime) || null
    : null;

  const returnEvents = (() => {
    if (
      Array.isArray(linkedBorrowRecord?.returnEvents) &&
      linkedBorrowRecord.returnEvents.length > 0
    ) {
      return linkedBorrowRecord.returnEvents;
    }
    if (Array.isArray(record.returnEvents) && record.returnEvents.length > 0) {
      return record.returnEvents;
    }
    if (matchingReturnRecords.length > 0) {
      return [...matchingReturnRecords]
        .reverse()
        .map((r) => ({
          id: r.id,
          dateTime: r.dateTime,
          quantity: r.quantity,
          person: r.person,
          returnedBy: r.returnedBy || r.person,
          remarks: r.returnRemarks || r.remarks,
        }));
    }
    return [];
  })();

  const latestRepresentative =
    record.returnedBy ||
    returnEvents[returnEvents.length - 1]?.returnedBy ||
    "";

  const borrowerAccountName =
    record.person || linkedBorrowRecord?.person || "Office Personnel";

  const hasDifferentRepresentative =
    Boolean(latestRepresentative) &&
    latestRepresentative.toLowerCase() !== borrowerAccountName.toLowerCase();

  const primaryRemark = isReturnedStatus
    ? record.borrowRemarks ||
      linkedBorrowRecord?.remarks ||
      record.remarks ||
      ""
    : record.remarks || "";

  const returnConditionNote = isReturnedStatus
    ? record.returnRemarks ||
      (record.borrowRemarks || linkedBorrowRecord?.remarks
        ? record.remarks !==
          (record.borrowRemarks || linkedBorrowRecord?.remarks)
          ? record.remarks
          : ""
        : record.remarks || "")
    : linkedBorrowRecord?.returnRemarks ||
      record.returnRemarks ||
      returnEvents[returnEvents.length - 1]?.remarks ||
      "";

  const remarksHeading = isBorrowable
    ? "Remark / Reason for Borrowing"
    : "Remark / Purpose of Request";

  const statusPillLabel = isPartiallyReturned
    ? `Partially Returned (${totalReturnedQty}/${totalBorrowedQty})`
    : isFullyReturned
      ? record.status === "Borrowed"
        ? `Borrowed · Returned (${totalReturnedQty}/${totalBorrowedQty})`
        : `Returned (${totalReturnedQty}/${totalBorrowedQty})`
      : record.status;

  const statusPillVariant = isPartiallyReturned
    ? "status-waiting"
    : isFullyReturned
      ? recordStatusClass("Returned")
      : recordStatusClass(record.status);

  return {
    isBorrowable,
    isReturnedStatus,
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
  };
}
