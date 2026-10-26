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
  window.localStorage.removeItem("officeflow.staff-name");
  render(
    <StaffInventory
      inventory={SAMPLE_INVENTORY}
      setInventory={jest.fn()}
      records={[]}
      setRecords={jest.fn()}
    />,
  );

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
