import { useCallback, useEffect, useMemo, useState } from "react";
import { isRecordCleared } from "../../../constants/system";
import {
  cabinetGroups,
  forwardedDestinations as defaultForwardedDestinations,
  UNFILED_LOCATION,
} from "../constants";
import { supabase } from "../../../supabase/supabaseClient";

const TRANSACTION_COLUMNS =
  "request_id, request_name, requested_by, request_date, origin_office, current_office, category, status, notes, released_date, req_user_id, file_location, archived_at, updated_at, created_at";
const INCOMING_COLUMNS = `${TRANSACTION_COLUMNS}, signature_status, forwarded_to`;
const HISTORY_COLUMNS =
  "record_id, request_id, transaction_table, changed_by, field, old_value, new_value, changed_at";
const TABLE_BY_DIRECTION = {
  outgoing: "transactions_ongoing",
  incoming: "transactions_incoming",
};

function normalized(value) {
  return String(value || "").trim().toLowerCase();
}

function toLocalDateTime(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "";
  const date = new Date(timestamp * 1000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function toUnixSeconds(value) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    throw new Error("Enter a valid request date and time.");
  }
  return Math.floor(timestamp / 1000);
}

function getDrawerParts(location) {
  const group = cabinetGroups.find((candidate) =>
    candidate.drawers.some((drawer) => drawer.id === location),
  );
  if (!group) {
    throw new Error(`Unknown cabinet location: ${location}`);
  }
  const drawerIndex = group.drawers.findIndex(
    (drawer) => drawer.id === location,
  );
  const drawer = group.drawers[drawerIndex];

  if (group.id === "cabinet-dean") {
    return {
      cabinet: group.title,
      drawer: drawerIndex + 1,
      section: drawer.id.slice("College Dean - ".length),
    };
  }

  const number = Number(drawer.id.match(/- D(\d+)$/)?.[1]);
  if (!Number.isInteger(number)) {
    throw new Error(`Could not determine the drawer number for ${location}.`);
  }
  return {
    cabinet: group.title,
    drawer: number,
    section: group.owner,
  };
}

function getLocationLabel(row) {
  const cabinet = normalized(row.cabinet);
  const group = cabinetGroups.find(
    (candidate) => normalized(candidate.title) === cabinet,
  );
  if (!group) return UNFILED_LOCATION;

  let drawerIndex = Number(row.drawer) - 1;
  if (group.id === "cabinet-dean") {
    const section = normalized(row.section);
    const sectionIndex = group.drawers.findIndex((drawer) =>
      normalized(drawer.id.slice("College Dean - ".length)) === section,
    );
    if (sectionIndex >= 0) drawerIndex = sectionIndex;
  }
  return group.drawers[drawerIndex]?.id || UNFILED_LOCATION;
}

function mapHistoryRow(row) {
  let status = row.new_value || "Updated";
  let location;
  if (row.field === "file_location") {
    status =
      row.new_value && row.new_value !== UNFILED_LOCATION
        ? "Filed in Cabinet"
        : "In Process";
    location = row.new_value || UNFILED_LOCATION;
  } else if (row.field === "forwarded_to") {
    status = row.new_value && row.new_value !== "Not sent out"
      ? "Sent Out"
      : "Forwarding cleared";
    location = row.new_value;
  } else if (row.field === "signature_status") {
    location = "Our Office";
  }
  return {
    status,
    location,
    dateTime: row.changed_at || "",
  };
}

function mapTransactionRow(row, direction, officesById, locationsById, history) {
  const isIncoming = direction === "incoming";
  const originOffice = officesById.get(Number(row.origin_office));
  const currentOffice = officesById.get(Number(row.current_office));
  const office = isIncoming ? originOffice : currentOffice;
  const forwardedOffice = officesById.get(Number(row.forwarded_to));
  const forwardedTo =
    !row.forwarded_to
      ? "Not sent out"
      : Number(row.forwarded_to) === Number(row.origin_office)
        ? "Returned to Sender"
        : forwardedOffice?.name || `Office ${row.forwarded_to}`;

  return {
    id: row.request_id,
    direction,
    transactionTable: TABLE_BY_DIRECTION[direction],
    document: row.request_name,
    student: row.requested_by,
    dateTime: toLocalDateTime(row.request_date),
    office: office?.name || `Office ${isIncoming ? row.origin_office : row.current_office}`,
    type: row.category,
    category: row.category,
    status: row.status,
    notes: row.notes || "",
    description: row.notes || "",
    fileLocation:
      locationsById.get(Number(row.file_location)) || UNFILED_LOCATION,
    signedByOffice: row.signature_status || "Unsigned",
    forwardedTo,
    history: history.map(mapHistoryRow),
  };
}

function makeHistoryRows(request, entries, changedBy) {
  const table = request.transactionTable || TABLE_BY_DIRECTION[request.direction];
  return entries.map((entry) => ({
    request_id: request.id,
    transaction_table: table,
    changed_by: changedBy,
    field: entry.field,
    old_value: entry.oldValue ?? null,
    new_value: entry.newValue ?? null,
    changed_at: new Date().toISOString(),
  }));
}

export function useSupabaseTransactions({ setRequests, isDemo = false }) {
  const [officeRows, setOfficeRows] = useState([]);
  const [locationRows, setLocationRows] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(!isDemo);
  const [isReady, setIsReady] = useState(isDemo);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (isDemo) {
      setIsLoading(false);
      setIsReady(true);
      setError("");
      return undefined;
    }

    let isMounted = true;

    async function loadTransactions() {
      setIsLoading(true);
      setError("");
      try {
        const authResult = await supabase.auth.getUser();
        if (authResult.error) throw authResult.error;
        const authUserId = authResult.data?.user?.id;
        if (!authUserId) throw new Error("Sign in to load transactions.");

        const [
          userResult,
          officesResult,
          locationsResult,
          outgoingResult,
          incomingResult,
          historyResult,
        ] = await Promise.all([
          supabase
            .from("users")
            .select("user_id, username, auth_user_id")
            .eq("auth_user_id", authUserId)
            .maybeSingle(),
          supabase.from("offices").select("office_id, name").order("name"),
          supabase
            .from("file_location")
            .select("location_id, drawer, cabinet, section")
            .order("cabinet"),
          supabase
            .from(TABLE_BY_DIRECTION.outgoing)
            .select(TRANSACTION_COLUMNS)
            .order("request_date", { ascending: false }),
          supabase
            .from(TABLE_BY_DIRECTION.incoming)
            .select(INCOMING_COLUMNS)
            .order("request_date", { ascending: false }),
          supabase
            .from("transaction_history")
            .select(HISTORY_COLUMNS)
            .order("changed_at"),
        ]);
        if (userResult.error) throw userResult.error;
        if (!userResult.data?.user_id) {
          throw new Error("Your account is not linked in public.users.");
        }
        for (const result of [
          officesResult,
          locationsResult,
          outgoingResult,
          incomingResult,
          historyResult,
        ]) {
          if (result.error) throw result.error;
        }

        const offices = Array.isArray(officesResult.data)
          ? officesResult.data
          : [];
        const locations = Array.isArray(locationsResult.data)
          ? locationsResult.data
          : [];
        const officeMap = new Map(
          offices.map((office) => [Number(office.office_id), office]),
        );
        const locationMap = new Map(
          locations.map((location) => [
            Number(location.location_id),
            getLocationLabel(location),
          ]),
        );
        const historyByTransaction = new Map();
        for (const row of historyResult.data || []) {
          const key = `${row.transaction_table}:${row.request_id}`;
          const history = historyByTransaction.get(key) || [];
          history.push(row);
          historyByTransaction.set(key, history);
        }
        const requests = [
          ...(outgoingResult.data || [])
            .filter((row) => !isRecordCleared(row.created_at))
            .map((row) =>
              mapTransactionRow(
                row,
                "outgoing",
                officeMap,
                locationMap,
                historyByTransaction.get(
                  `${TABLE_BY_DIRECTION.outgoing}:${row.request_id}`,
                ) || [],
              ),
            ),
          ...(incomingResult.data || [])
            .filter((row) => !isRecordCleared(row.created_at))
            .map((row) =>
              mapTransactionRow(
                row,
                "incoming",
                officeMap,
                locationMap,
                historyByTransaction.get(
                  `${TABLE_BY_DIRECTION.incoming}:${row.request_id}`,
                ) || [],
              ),
            ),
        ];

        if (!isMounted) return;
        setOfficeRows(offices);
        setLocationRows(locations);
        setUser(userResult.data);
        setRequests(requests);
        setIsReady(true);
      } catch (loadError) {
        if (!isMounted) return;
        console.error("Could not load transactions from Supabase.", loadError);
        setError(`Could not load transactions: ${loadError.message}`);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTransactions();
    return () => {
      isMounted = false;
    };
  }, [isDemo, reloadToken, setRequests]);

  const officeNames = useMemo(
    () => officeRows.map((office) => office.name).filter(Boolean),
    [officeRows],
  );
  const forwardedOptions = useMemo(
    () => [
      ...defaultForwardedDestinations.slice(0, 2),
      ...officeNames.filter((office) => !["Not sent out", "Returned to Sender"].includes(office)),
    ],
    [officeNames],
  );

  const resolveOfficeId = useCallback(
    (name) => {
      const office = officeRows.find(
        (row) => normalized(row.name) === normalized(name),
      );
      if (!office) {
        throw new Error(
          `The office "${name}" is not available in public.offices.`,
        );
      }
      return Number(office.office_id);
    },
    [officeRows],
  );

  const resolveFileLocationId = useCallback(
    async (label) => {
      if (!label || label === UNFILED_LOCATION) return null;
      const parts = getDrawerParts(label);
      const matchingRow = locationRows.find((row) => {
        if (
          normalized(row.cabinet) !== normalized(parts.cabinet) ||
          Number(row.drawer) !== parts.drawer
        ) {
          return false;
        }
        return (
          !parts.section ||
          !row.section ||
          normalized(row.section) === normalized(parts.section)
        );
      });
      if (matchingRow) return Number(matchingRow.location_id);

      const { data, error: insertError } = await supabase
        .from("file_location")
        .insert(parts)
        .select("location_id, drawer, cabinet, section")
        .single();
      if (insertError) throw insertError;
      if (!data) {
        throw new Error("Supabase did not return the saved cabinet location.");
      }
      setLocationRows((current) => [...current, data]);
      return Number(data.location_id);
    },
    [locationRows],
  );

  const getRequestTable = (request) =>
    request.transactionTable ||
    TABLE_BY_DIRECTION[request.direction === "incoming" ? "incoming" : "outgoing"];

  const saveHistory = useCallback(
    async (request, entries) => {
      if (!entries.length) return true;
      const rows = makeHistoryRows(
        request,
        entries,
        user?.username || String(user?.user_id || ""),
      );
      const { error: insertError } = await supabase
        .from("transaction_history")
        .insert(rows);
      if (insertError) throw insertError;
      return true;
    },
    [user],
  );

  const persistHistorySafely = useCallback(
    async (request, entries) => {
      try {
        await saveHistory(request, entries);
      } catch (historyError) {
        console.error("Could not save transaction history.", historyError);
        setError(
          `Transaction saved, but its history could not be saved: ${historyError.message}`,
        );
        return false;
      }
      return true;
    },
    [saveHistory],
  );

  const persistAdd = useCallback(
    async (request) => {
      if (!user?.user_id) throw new Error("Your account is not linked in public.users.");
      const isIncoming = request.direction === "incoming";
      const table = TABLE_BY_DIRECTION[isIncoming ? "incoming" : "outgoing"];
      const officeId = resolveOfficeId(request.office);
      const internalOfficeId = resolveOfficeId("Secretary's Office");
      const locationId = await resolveFileLocationId(request.fileLocation);
      let forwardedToId = null;
      if (isIncoming && request.forwardedTo !== "Not sent out") {
        forwardedToId =
          request.forwardedTo === "Returned to Sender"
            ? officeId
            : resolveOfficeId(request.forwardedTo);
      }

      const now = new Date().toISOString();
      const row = {
        request_name: request.document.trim(),
        requested_by: request.student.trim(),
        request_date: toUnixSeconds(request.dateTime),
        origin_office: isIncoming ? officeId : internalOfficeId,
        current_office: isIncoming ? internalOfficeId : officeId,
        category: request.type,
        status: request.status,
        notes: request.description || null,
        released_date:
          request.status === "Archived" ? Math.floor(Date.now() / 1000) : null,
        req_user_id: user.user_id,
        file_location: locationId,
        created_at: now,
        updated_at: now,
        ...(isIncoming
          ? {
              signature_status: request.signedByOffice || "Unsigned",
              forwarded_to: forwardedToId,
            }
          : {}),
      };
      const { data, error: insertError } = await supabase
        .from(table)
        .insert(row)
        .select(isIncoming ? INCOMING_COLUMNS : TRANSACTION_COLUMNS)
        .single();
      if (insertError) throw insertError;
      if (!data) throw new Error("Supabase did not return the saved transaction.");

      const locationMap = new Map(
        locationRows.map((location) => [
          Number(location.location_id),
          getLocationLabel(location),
        ]),
      );
      if (locationId && !locationMap.has(locationId)) {
        locationMap.set(locationId, request.fileLocation);
      }
      const saved = {
        ...mapTransactionRow(
          data,
          isIncoming ? "incoming" : "outgoing",
          new Map(
            officeRows.map((office) => [
              Number(office.office_id),
              office,
            ]),
          ),
          locationMap,
          [],
        ),
        history: request.history || [],
      };
      setError("");
      await persistHistorySafely(saved, [
        { field: "status", newValue: saved.status },
        ...(saved.fileLocation !== UNFILED_LOCATION
          ? [{ field: "file_location", newValue: saved.fileLocation }]
          : []),
      ]);
      return saved;
    },
    [
      locationRows,
      officeRows,
      persistHistorySafely,
      resolveFileLocationId,
      resolveOfficeId,
      user,
    ],
  );

  const persistUpdate = useCallback(
    async (previous, next) => {
      const table = getRequestTable(previous);
      const isIncoming = previous.direction === "incoming";
      const patch = { updated_at: new Date().toISOString() };
      const historyEntries = [];
      if (previous.status !== next.status) {
        patch.status = next.status;
        patch.released_date =
          next.status === "Archived"
            ? Math.floor(Date.now() / 1000)
            : null;
        historyEntries.push({
          field: "status",
          oldValue: previous.status,
          newValue: next.status,
        });
      }
      if (
        previous.fileLocation !== next.fileLocation
      ) {
        patch.file_location = await resolveFileLocationId(next.fileLocation);
        historyEntries.push({
          field: "file_location",
          oldValue: previous.fileLocation || UNFILED_LOCATION,
          newValue: next.fileLocation || UNFILED_LOCATION,
        });
      }
      if (isIncoming && previous.signedByOffice !== next.signedByOffice) {
        patch.signature_status = next.signedByOffice;
        historyEntries.push({
          field: "signature_status",
          oldValue: previous.signedByOffice,
          newValue: next.signedByOffice,
        });
      }
      if (isIncoming && previous.forwardedTo !== next.forwardedTo) {
        patch.forwarded_to =
          !next.forwardedTo || next.forwardedTo === "Not sent out"
            ? null
            : next.forwardedTo === "Returned to Sender"
              ? resolveOfficeId(previous.office)
              : resolveOfficeId(next.forwardedTo);
        historyEntries.push({
          field: "forwarded_to",
          oldValue: previous.forwardedTo || "Not sent out",
          newValue: next.forwardedTo || "Not sent out",
        });
      }

      const { data, error: updateError } = await supabase
        .from(table)
        .update(patch)
        .eq("request_id", previous.id)
        .select("request_id")
        .maybeSingle();
      if (updateError) throw updateError;
      if (!data) throw new Error("The transaction could not be updated.");
      setError("");
      await persistHistorySafely(next, historyEntries);
    },
    [persistHistorySafely, resolveFileLocationId, resolveOfficeId],
  );

  const persistDelete = useCallback(async (request) => {
    const table = getRequestTable(request);
    const { data, error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq("request_id", request.id)
      .select("request_id")
      .maybeSingle();
    if (deleteError) throw deleteError;
    if (!data) throw new Error("The transaction could not be deleted.");

    const { error: historyDeleteError } = await supabase
      .from("transaction_history")
      .delete()
      .eq("transaction_table", table)
      .eq("request_id", request.id);
    if (historyDeleteError) {
      setError(
        `Transaction deleted, but its history could not be deleted: ${historyDeleteError.message}`,
      );
      console.error("Could not delete transaction history.", historyDeleteError);
    } else {
      setError("");
    }
  }, []);

  const reportPersistenceError = useCallback(
    (operation, saveError) => {
      console.error(`Could not ${operation} the transaction.`, saveError);
      setError(`Could not ${operation} the transaction: ${saveError.message}`);
    },
    [],
  );

  return {
    error,
    forwardedOptions,
    isReady,
    isLoading,
    officeNames,
    persistAdd,
    persistDelete,
    persistUpdate,
    reload,
    reportPersistenceError,
  };
}
