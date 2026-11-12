import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import Inventory from "./Inventory";
import { supabase } from "../../supabase/supabaseClient";

jest.mock("../../supabase/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const SAMPLE_INVENTORY = [
  {
    id: "supply-1",
    productId: "PRD-0001",
    name: "Folders",
    quantity: 32,
    unit: "Boxes",
    lowStockAt: 5,
    unitCost: 50,
  },
];

const SAMPLE_RECORDS = [
  {
    id: "REC-1792648790538-7",
    dateTime: "2026-10-22T13:59:00.000Z",
    person: "Prof. Ezekiel Ygan",
    productId: "PRD-0001",
    productName: "Folders",
    quantity: 30,
    unit: "Boxes",
    status: "Borrowed",
  },
  {
    id: "REC-1792648510294-4",
    dateTime: "2026-10-22T13:42:00.000Z",
    person: "Dr. Maria Santos",
    productId: "PRD-0002",
    productName: "A4 Bond Paper (Sub 20)",
    quantity: 2,
    unit: "Reams",
    unitCost: 50,
    status: "Used",
  },
];

function mockMasterlistResponse(data = [], error = null) {
  const query = {
    select: jest.fn(),
    is: jest.fn(),
    order: jest.fn().mockResolvedValue({ data, error }),
  };
  query.select.mockReturnValue(query);
  query.is.mockReturnValue(query);
  supabase.from.mockReturnValue(query);
  return query;
}

function InventoryWithState(props) {
  const [inventory, setInventory] = useState(props.inventory || []);
  return <Inventory {...props} inventory={inventory} setInventory={setInventory} />;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockMasterlistResponse();
});

test("renders bento metrics and switches between Master list and Transaction folder tabs", async () => {
  await act(async () => {
    render(
      <Inventory
        inventory={SAMPLE_INVENTORY}
        setInventory={jest.fn()}
        records={SAMPLE_RECORDS}
        setRecords={jest.fn()}
      />,
    );
  });

  expect(
    screen.getByRole("heading", { name: /supply & inventory/i }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /reset inventory/i }),
  ).not.toBeInTheDocument();
  expect(screen.getByText(/tracked products/i)).toBeInTheDocument();
  expect(screen.getByText(/transaction records/i)).toBeInTheDocument();
  expect(screen.getByText(/recorded usage value/i)).toBeInTheDocument();

  // Master list tab is active by default
  const masterTab = screen.getByRole("tab", { name: /master list/i });
  const transactionTab = screen.getByRole("tab", { name: /transaction/i });
  expect(masterTab).toHaveAttribute("aria-selected", "true");
  expect(
    screen.getByPlaceholderText(/search product name, id, or stock level/i),
  ).toBeInTheDocument();
  expect(screen.getAllByText("Folders").length).toBeGreaterThan(0);
  expect(screen.getByText("32 Boxes")).toBeInTheDocument();

  // Switch to Transaction tab
  fireEvent.click(transactionTab);
  expect(transactionTab).toHaveAttribute("aria-selected", "true");
  expect(
    screen.getByPlaceholderText(/search borrower, record id, or product/i),
  ).toBeInTheDocument();
  expect(screen.getByText("REC-1792648790538-7")).toBeInTheDocument();
  expect(screen.getByText("Prof. Ezekiel Ygan")).toBeInTheDocument();

  // Filter transaction records by status
  const statusSelect = screen.getByRole("combobox", { name: /filter status/i });
  fireEvent.change(statusSelect, { target: { value: "Used" } });
  expect(screen.queryByText("REC-1792648790538-7")).not.toBeInTheDocument();
  expect(screen.getByText("Dr. Maria Santos")).toBeInTheDocument();
});

test("loads and renders secretary masterlist items from Supabase", async () => {
  const item = {
    item_id: 17,
    item_name: "Bond paper",
    stock_onhand: 120,
    unit: "reams",
    min_stock: 10,
    category: "Office supplies",
    classification: "Consumable",
    archived_at: null,
    created_at: "2026-10-12",
  };
  const query = mockMasterlistResponse([item]);

  await act(async () => {
    render(
      <InventoryWithState
        inventory={[]}
        records={[]}
        setRecords={jest.fn()}
      />,
    );
  });

  expect(await screen.findByText("Bond paper")).toBeInTheDocument();
  expect(screen.getByText("PRD-0017")).toBeInTheDocument();
  expect(screen.getByText("120 reams")).toBeInTheDocument();
  expect(
    screen.getByText("Office supplies · Consumable"),
  ).toBeInTheDocument();
  expect(supabase.from).toHaveBeenCalledWith("items_masterlist");
  expect(query.select).toHaveBeenCalledWith(
    "item_id, item_name, stock_onhand, unit, min_stock, category, classification, archived_at, created_at",
  );
  expect(query.is).toHaveBeenCalledWith("archived_at", null);
  expect(query.order).toHaveBeenCalledWith("item_name");
});

test("opens item details from the master list actions", async () => {
  const setInventory = jest.fn();
  await act(async () => {
    render(
      <Inventory
        inventory={SAMPLE_INVENTORY}
        setInventory={setInventory}
        records={[
          {
            ...SAMPLE_RECORDS[0],
            remarks: "Department workshop",
          },
        ]}
        setRecords={jest.fn()}
      />,
    );
  });

  fireEvent.click(
    screen.getByRole("button", { name: "Open item details for Folders" }),
  );

  const detailsDialog = within(screen.getByRole("dialog"));
  expect(detailsDialog.getByText("PRD-0001")).toBeInTheDocument();
  expect(detailsDialog.getByText("32 Boxes")).toBeInTheDocument();
  expect(detailsDialog.getByText("Minimum stock")).toBeInTheDocument();
  expect(detailsDialog.getByText("Usable")).toBeInTheDocument();
  expect(detailsDialog.getByText("Item")).toBeInTheDocument();
  expect(detailsDialog.getByText("Prof. Ezekiel Ygan")).toBeInTheDocument();
  expect(detailsDialog.getByText("Department workshop")).toBeInTheDocument();
  expect(
    detailsDialog.getByRole("img", { name: "Usage trend for Folders" }),
  ).toBeInTheDocument();

  fireEvent.click(detailsDialog.getByRole("button", { name: "Edit stock details" }));
  fireEvent.change(detailsDialog.getByRole("spinbutton", { name: "Stock on hand" }), {
    target: { value: "24" },
  });
  fireEvent.change(detailsDialog.getByRole("textbox", { name: "Unit" }), {
    target: { value: "Packs" },
  });
  fireEvent.change(detailsDialog.getByRole("spinbutton", { name: "Minimum stock" }), {
    target: { value: "8" },
  });
  fireEvent.click(detailsDialog.getByRole("button", { name: "Save changes" }));

  const inventoryUpdate = setInventory.mock.calls[setInventory.mock.calls.length - 1][0];
  expect(inventoryUpdate(SAMPLE_INVENTORY)[0]).toMatchObject({
    quantity: 24,
    unit: "Packs",
    lowStockAt: 8,
  });
  expect(detailsDialog.getByText("24 Packs")).toBeInTheDocument();
  expect(detailsDialog.getByText("8 Packs")).toBeInTheDocument();
});
