import { fireEvent, render, screen } from "@testing-library/react";
import StaffInventory from "./Inventory";

const SAMPLE_INVENTORY = [
  {
    id: "supply-1",
    productId: "PRD-0001",
    name: "Folders",
    quantity: 32,
    unit: "Boxes",
  },
  {
    id: "supply-2",
    productId: "PRD-0002",
    name: "Ballpoint pens",
    quantity: 18,
    unit: "Pieces",
  },
];

test("filters available supplies by name or product ID", () => {
  render(
    <StaffInventory
      inventory={SAMPLE_INVENTORY}
      setInventory={jest.fn()}
      records={[]}
      setRecords={jest.fn()}
      profile={{ name: "Prof. Juan Dela Cruz", email: "juan@deptdesk.edu" }}
    />,
  );

  expect(screen.queryByText(/recording as/i)).not.toBeInTheDocument();
  const search = screen.getByRole("searchbox", { name: /search supplies/i });
  expect(screen.getByText("Folders")).toBeInTheDocument();
  expect(screen.getByText("Ballpoint pens")).toBeInTheDocument();

  fireEvent.change(search, { target: { value: "prd-0002" } });
  expect(screen.queryByText("Folders")).not.toBeInTheDocument();
  expect(screen.getByText("Ballpoint pens")).toBeInTheDocument();

  fireEvent.change(search, { target: { value: "FOLDER" } });
  expect(screen.getByText("Folders")).toBeInTheDocument();
  expect(screen.queryByText("Ballpoint pens")).not.toBeInTheDocument();
});

test("automatically uses logged-in account credentials when recording supplies", () => {
  let savedRecords = [];
  const setRecords = jest.fn((updater) => {
    savedRecords =
      typeof updater === "function" ? updater(savedRecords) : updater;
  });
  render(
    <StaffInventory
      inventory={SAMPLE_INVENTORY}
      setInventory={jest.fn()}
      records={savedRecords}
      setRecords={setRecords}
      profile={{ name: "Prof. Maria Clara", email: "maria@deptdesk.edu" }}
    />,
  );

  const borrowButtons = screen.getAllByRole("button", { name: /^borrow$/i });
  expect(borrowButtons[0]).not.toBeDisabled();
  fireEvent.click(borrowButtons[0]);

  fireEvent.change(screen.getByLabelText(/remark \/ reason for borrowing/i), {
    target: { value: "Class activity" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: /record borrow & view receipt/i }),
  );

  expect(savedRecords).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        person: "Prof. Maria Clara",
        productName: "Folders",
        status: "Borrowed",
      }),
    ]),
  );
});
