import { useEffect, useMemo, useState } from "react";
import "../inventory/Inventory.css";
import "./InventoryStaff.css";
import { PageHeader } from "../../components/ui";
import {
  getProductId,
  useInventoryActions,
} from "../../hooks/useInventoryActions";
import { supabase } from "../../supabase/supabaseClient";
import {
  INVENTORY_TRANSACTION_COLUMNS,
  MASTERLIST_COLUMNS,
  mapInventoryTransactions,
  mapMasterlistItem,
  persistInventoryTransaction,
} from "../../utils/inventory";
import { matchesQuery } from "../../utils/search";
import InventoryReceiptModal from "../inventory/components/InventoryReceiptModal";
import StaffBorrowModal from "./components/StaffBorrowModal";
import StaffHistoryTable from "./components/StaffHistoryTable";
import StaffSupplyList from "./components/StaffSupplyList";

function StaffInventory({
  inventory = [],
  setInventory = () => {
    throw new Error("StaffInventory requires a setInventory callback.");
  },
  records = [],
  setRecords = () => {
    throw new Error("StaffInventory requires a setRecords callback.");
  },
  search = "",
  profile,
  role,
}) {
  const [supplySearch, setSupplySearch] = useState("");
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState("");
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState("");
  const [transactionUser, setTransactionUser] = useState(null);
  const person = String(
    transactionUser?.username ||
      profile?.name ||
      profile?.email ||
      role?.name ||
      "Faculty / Staff",
  ).trim();

  useEffect(() => {
    let isMounted = true;

    async function loadInventoryAndTransactions() {
      const authResult = await supabase.auth.getUser();

      if (!isMounted) return;
      if (authResult.error || !authResult.data?.user?.id) {
        const authError =
          authResult.error || new Error("No authenticated Supabase user.");
        console.error("Could not identify the signed-in staff account.", authError);
        setInventory([]);
        setInventoryError(
          "This session is not authenticated with Supabase. Sign in with your account to load inventory.",
        );
        setTransactionsError(
          "This session is not authenticated with Supabase. Sign in with your account to view or record transactions.",
        );
        setRecords([]);
        setTransactionUser(null);
        setInventoryLoading(false);
        setTransactionsLoading(false);
        return;
      }

      const authUserId = authResult.data.user.id;
      const [itemsResult, userResult, transactionsResult] = await Promise.all([
        supabase
          .from("items_masterlist")
          .select(MASTERLIST_COLUMNS)
          .is("archived_at", null)
          .order("item_name"),
        supabase
          .from("users")
          .select("user_id, username, auth_user_id")
          .eq("auth_user_id", authUserId)
          .maybeSingle(),
        supabase
          .from("inventory_transactions")
          .select(INVENTORY_TRANSACTION_COLUMNS)
          .order("created_at", { ascending: false }),
      ]);
      if (!isMounted) return;

      if (itemsResult.error) {
        console.error(
          "Could not load the staff inventory masterlist.",
          itemsResult.error,
        );
        setInventoryError(
          `Could not load supplies: ${itemsResult.error.message}`,
        );
        setInventory([]);
      } else {
        const items = (Array.isArray(itemsResult.data) ? itemsResult.data : [])
          .map(mapMasterlistItem);
        setInventory(items);
        setInventoryError("");
      }
      setInventoryLoading(false);

      const linkedUser = userResult.data;
      if (userResult.error || !linkedUser?.user_id) {
        console.error(
          "Could not load the signed-in user's public.users row.",
          userResult.error || new Error("No linked public.users row found."),
        );
        setTransactionUser(null);
        setTransactionsError(
          userResult.error
            ? `Could not read your public.users row: ${userResult.error.message}`
            : "Your account is not linked in public.users. Contact the administrator.",
        );
      } else {
        setTransactionUser(linkedUser);
        setTransactionsError("");
      }

      if (transactionsResult.error) {
        console.error(
          "Could not load the staff inventory transactions.",
          transactionsResult.error,
        );
        setTransactionsError(
          `Could not load your inventory transactions: ${transactionsResult.error.message}`,
        );
      } else {
        const inventoryById = new Map(
          (Array.isArray(itemsResult.data) ? itemsResult.data : [])
            .map(mapMasterlistItem)
            .map((item) => [Number(item.item_id), item]),
        );
        const usersById = new Map(
          linkedUser
            ? [[Number(linkedUser.user_id), linkedUser]]
            : [],
        );
        const myTransactions = mapInventoryTransactions(
          transactionsResult.data,
          inventoryById,
          usersById,
        ).filter(
          (record) =>
            linkedUser &&
            Number(record.personUserId) === Number(linkedUser.user_id),
        );
        setRecords(myTransactions);
      }
      setTransactionsLoading(false);
    }

    loadInventoryAndTransactions().catch((error) => {
      if (!isMounted) return;
      console.error("Could not load staff inventory data.", error);
      setInventoryError(`Could not load supplies: ${error.message}`);
      setTransactionsError(
        `Could not load your inventory transactions: ${error.message}`,
      );
      setInventoryLoading(false);
      setTransactionsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [setInventory, setRecords]);

  const inventoryItems = useMemo(
    () => (Array.isArray(inventory) ? inventory.filter(Boolean) : []),
    [inventory],
  );
  const recordItems = useMemo(
    () => (Array.isArray(records) ? records.filter(Boolean) : []),
    [records],
  );
  const myRecords = useMemo(
    () =>
      transactionUser
        ? recordItems.filter(
            (record) =>
              Number(record.personUserId) === Number(transactionUser.user_id),
          )
        : person
        ? recordItems.filter(
            (record) =>
              String(record.person || "").toLowerCase() === person.toLowerCase(),
          )
        : [],
    [recordItems, person, transactionUser],
  );
  const visibleItems = useMemo(
    () =>
      inventoryItems.filter(
        (item) =>
          matchesQuery(
            search,
            item.item_id,
            getProductId(item),
            item.name,
            item.unit,
            item.category,
            item.classification,
          ) &&
          matchesQuery(
            supplySearch,
            item.item_id,
            getProductId(item),
            item.name,
            item.unit,
            item.category,
            item.classification,
          ),
      ),
    [inventoryItems, search, supplySearch],
  );

  const {
    action,
    closeAction,
    closeReceipt,
    error,
    isSubmitting,
    getBorrowedBalance: getMyBorrowedBalance,
    openAction,
    openReceipt,
    quantity,
    receiptRecord,
    remarks,
    returnedBy,
    setQuantity,
    setRemarks,
    setReturnedBy,
    submitAction,
  } = useInventoryActions({
    inventory: inventoryItems,
    records: recordItems,
    balanceRecords: myRecords,
    setInventory,
    setRecords,
    persistAction: async ({
      actionType,
      amount,
      item,
      matchedBorrowRecord,
      record,
    }) => {
      if (!transactionUser?.user_id) {
        throw new Error(
          "Your account is not linked in public.users. Contact the administrator.",
        );
      }
      return persistInventoryTransaction({
        supabaseClient: supabase,
        item,
        recipientId: transactionUser.user_id,
        actionType,
        amount,
        matchedBorrowRecord,
        record,
      });
    },
    person,
    requirePerson: true,
    requireRemarks: true,
    returnLimitMessage: "You cannot return more than you borrowed.",
  });

  return (
    <div className="dashboard module-page staff-inventory-page">
      <PageHeader
        eyebrow="FACULTY & STAFF · SELF-SERVICE PORTAL"
        title="Office supplies"
        subtitle="Borrow, return, or record supplies used under your account."
      />

      <StaffSupplyList
        items={visibleItems}
        totalItems={inventoryItems.length}
        isLoading={inventoryLoading || transactionsLoading}
        loadError={inventoryError || transactionsError}
        supplySearch={supplySearch}
        onSupplySearchChange={setSupplySearch}
        canRecord={Boolean(
          person &&
            transactionUser?.user_id &&
            !inventoryLoading &&
            !transactionsLoading &&
            !inventoryError &&
            !transactionsError,
        )}
        getMyBorrowedBalance={getMyBorrowedBalance}
        onOpenAction={openAction}
      />

      <StaffHistoryTable
        records={myRecords}
        isLoading={transactionsLoading}
        loadError={transactionsError}
        hasName={Boolean(person)}
        onViewReceipt={openReceipt}
      />

      <StaffBorrowModal
        action={action}
        quantity={quantity}
        setQuantity={setQuantity}
        returnedBy={returnedBy}
        setReturnedBy={setReturnedBy}
        remarks={remarks}
        setRemarks={setRemarks}
        error={error}
        isSubmitting={isSubmitting}
        maxQuantity={
          action
            ? action.type === "Return"
              ? getMyBorrowedBalance(action.item)
              : Number(action.item.quantity)
            : 0
        }
        onSubmit={submitAction}
        onClose={closeAction}
      />

      <InventoryReceiptModal
        record={receiptRecord}
        inventory={inventoryItems}
        records={recordItems}
        onClose={closeReceipt}
      />
    </div>
  );
}

export default StaffInventory;
