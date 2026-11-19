import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { emptyForm } from "../constants";
import TransactionForm from "./TransactionForm";

function ControlledTransactionForm({ onAddOffice }) {
  const [form, setForm] = useState(emptyForm("outgoing"));
  return (
    <TransactionForm
      isOpen
      form={form}
      setForm={setForm}
      formError=""
      onSubmit={jest.fn()}
      onAddOffice={onAddOffice}
      offices={["Finance Office", "Registrar"]}
      categories={["Document", "Request"]}
      outgoingStatuses={["Pending"]}
      incomingStatuses={["Received"]}
      forwardedDestinations={["Not sent out", "Returned to Sender"]}
    />
  );
}

test("searches offices on the outgoing request form", () => {
  render(<ControlledTransactionForm onAddOffice={jest.fn()} />);
  const dialog = within(screen.getByRole("dialog"));
  const officeInput = dialog.getByRole("combobox", { name: "Office" });

  fireEvent.change(officeInput, { target: { value: "Reg" } });
  expect(
    dialog.getByRole("option", { name: "Registrar" }),
  ).toBeInTheDocument();
  expect(
    dialog.queryByRole("option", { name: "Finance Office" }),
  ).not.toBeInTheDocument();
});

test("searches offices and offers to add a missing office for an incoming request", async () => {
  const onAddOffice = jest.fn().mockResolvedValue("Research Office");
  render(<ControlledTransactionForm onAddOffice={onAddOffice} />);

  fireEvent.click(
    screen.getByRole("button", { name: /incoming from other office/i }),
  );
  const dialog = within(screen.getByRole("dialog"));
  const officeInput = dialog.getByRole("combobox", {
    name: /from office \(origin\)/i,
  });

  fireEvent.change(officeInput, { target: { value: "Finance" } });
  expect(
    dialog.getByRole("option", { name: "Finance Office" }),
  ).toBeInTheDocument();
  expect(
    dialog.queryByRole("option", { name: "Registrar" }),
  ).not.toBeInTheDocument();
  fireEvent.click(dialog.getByRole("option", { name: "Finance Office" }));
  expect(officeInput).toHaveValue("Finance Office");

  fireEvent.change(officeInput, { target: { value: "Research Office" } });
  fireEvent.click(
    dialog.getByRole("button", {
      name: "Add a new office: Research Office",
    }),
  );

  expect(onAddOffice).toHaveBeenCalledWith("Research Office");
  await waitFor(() => expect(officeInput).toHaveValue("Research Office"));
});
