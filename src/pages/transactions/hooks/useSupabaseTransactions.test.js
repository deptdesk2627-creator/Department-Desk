import { act, renderHook, waitFor } from "@testing-library/react";
import { supabase } from "../../../supabase/supabaseClient";
import { useSupabaseTransactions } from "./useSupabaseTransactions";

jest.mock("../../../supabase/supabaseClient", () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}));

let queries;
let setRequests;

function createQuery(table) {
  let inserted;
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn(() => {
      const responses = {
        offices: [
          { office_id: 1, name: "Registrar" },
          { office_id: 2, name: "Secretary's Office" },
          { office_id: 3, name: "Dean's Office" },
        ],
        file_location: [],
        transactions_ongoing: [],
        transactions_incoming: [],
        transaction_history: [],
      };
      return Promise.resolve({ data: responses[table] || [], error: null });
    }),
    maybeSingle: jest.fn(() =>
      Promise.resolve({ data: { user_id: 7 }, error: null }),
    ),
    insert: jest.fn((row) => {
      inserted = row;
      return query;
    }),
    single: jest.fn(() => {
      if (table === "file_location") {
        return Promise.resolve({
          data: { location_id: 40, ...inserted },
          error: null,
        });
      }
      const row = Array.isArray(inserted) ? inserted[0] : inserted;
      return Promise.resolve({
        data: { ...row, request_id: 101 },
        error: null,
      });
    }),
    update: jest.fn(() => query),
    delete: jest.fn(() => query),
  };
  queries[table] = query;
  return query;
}

beforeEach(() => {
  jest.clearAllMocks();
  queries = {};
  setRequests = jest.fn();
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "auth-user-7" } },
    error: null,
  });
  supabase.from.mockImplementation(createQuery);
});

test("creates outgoing and incoming records with their database lookups and history", async () => {
  const { result } = renderHook(() => useSupabaseTransactions({ setRequests }));
  await waitFor(() => expect(result.current.isReady).toBe(true));

  let outgoing;
  await act(async () => {
    outgoing = await result.current.persistAdd({
      direction: "outgoing",
      document: "Budget request",
      student: "Jordan Lee",
      dateTime: "2026-11-15T10:30",
      office: "Registrar",
      type: "Request",
      status: "Pending",
      description: "Budget review",
      fileLocation: "CICT Cabinet 3 - D1",
    });
  });

  expect(queries.file_location.insert).toHaveBeenCalledWith({
    cabinet: "CICT Cabinet 3",
    drawer: 1,
    section: "College Staff",
  });
  expect(queries.transactions_ongoing.insert).toHaveBeenCalledWith(
    expect.objectContaining({
      request_name: "Budget request",
      requested_by: "Jordan Lee",
      origin_office: 2,
      current_office: 1,
      req_user_id: 7,
      file_location: 40,
    }),
  );
  expect(outgoing).toEqual(
    expect.objectContaining({
      id: 101,
      direction: "outgoing",
      office: "Registrar",
      fileLocation: "CICT Cabinet 3 - D1",
    }),
  );
  expect(queries.transaction_history.insert).toHaveBeenCalledWith([
    expect.objectContaining({
      request_id: 101,
      transaction_table: "transactions_ongoing",
      field: "status",
      new_value: "Pending",
    }),
    expect.objectContaining({
      field: "file_location",
      new_value: "CICT Cabinet 3 - D1",
    }),
  ]);

  await act(async () => {
    await result.current.persistAdd({
      direction: "incoming",
      document: "Signed memorandum",
      student: "Registrar Clerk",
      dateTime: "2026-11-15T11:30",
      office: "Registrar",
      type: "Document",
      status: "Received",
      description: "",
      fileLocation: "In Process (Not yet filed)",
      signedByOffice: "Unsigned",
      forwardedTo: "Returned to Sender",
    });
  });
  expect(queries.transactions_incoming.insert).toHaveBeenCalledWith(
    expect.objectContaining({
      origin_office: 1,
      current_office: 2,
      signature_status: "Unsigned",
      forwarded_to: 1,
    }),
  );
});

test("persists incoming status, signature, forwarding, and delete changes", async () => {
  const { result } = renderHook(() => useSupabaseTransactions({ setRequests }));
  await waitFor(() => expect(result.current.isReady).toBe(true));

  const original = {
    id: 33,
    direction: "incoming",
    transactionTable: "transactions_incoming",
    office: "Registrar",
    status: "Received",
    signedByOffice: "Unsigned",
    forwardedTo: "Not sent out",
    fileLocation: "In Process (Not yet filed)",
  };
  const updated = {
    ...original,
    status: "Sent Out",
    signedByOffice: "Signed by Secretary",
    forwardedTo: "Returned to Sender",
  };
  await act(async () => {
    await result.current.persistUpdate(original, updated);
  });

  expect(queries.transactions_incoming.update).toHaveBeenCalledWith(
    expect.objectContaining({
      status: "Sent Out",
      signature_status: "Signed by Secretary",
      forwarded_to: 1,
    }),
  );
  expect(queries.transaction_history.insert).toHaveBeenCalledWith(
    expect.arrayContaining([
      expect.objectContaining({
        transaction_table: "transactions_incoming",
        request_id: 33,
        field: "signature_status",
      }),
      expect.objectContaining({
        transaction_table: "transactions_incoming",
        request_id: 33,
        field: "forwarded_to",
      }),
    ]),
  );

  await act(async () => {
    await result.current.persistDelete(original);
  });
  expect(queries.transactions_incoming.delete).toHaveBeenCalled();
  expect(queries.transaction_history.delete).toHaveBeenCalled();
  expect(queries.transaction_history.eq).toHaveBeenCalledWith(
    "transaction_table",
    "transactions_incoming",
  );
});
