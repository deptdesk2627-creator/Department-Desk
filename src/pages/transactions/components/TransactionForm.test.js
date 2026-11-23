import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { emptyForm } from "../constants";
import { csvValue } from "../utils/transactionHelpers";
import TransactionForm from "./TransactionForm";

function ControlledTransactionForm() {
  const [form, setForm] = useState(emptyForm("outgoing"));
  return (
    <TransactionForm
      isOpen
      form={form}
      setForm={setForm}
      formError=""
      onSubmit={jest.fn()}
      offices={["Finance Office", "Registrar"]}
      categories={["Document", "Request"]}
      outgoingStatuses={["Pending"]}
      incomingStatuses={["Received"]}
      forwardedDestinations={["Not sent out", "Returned to Sender"]}
    />
  );
}

test("renders office select options and custom office input on outgoing request form", () => {
  render(<ControlledTransactionForm />);
  const dialog = within(screen.getByRole("dialog"));
  const officeSelect = dialog.getByRole("combobox", {
    name: /office \(where to go\)/i,
  });

  expect(
    dialog.getByRole("option", { name: "Finance Office" }),
  ).toBeInTheDocument();
  expect(
    dialog.getByRole("option", { name: "Registrar" }),
  ).toBeInTheDocument();
  expect(dialog.getByRole("option", { name: "Other" })).toBeInTheDocument();

  fireEvent.change(officeSelect, { target: { value: "Registrar" } });
  expect(officeSelect).toHaveValue("Registrar");
  expect(
    dialog.queryByLabelText(/specify destination office/i),
  ).not.toBeInTheDocument();

  fireEvent.change(officeSelect, { target: { value: "Other" } });
  const customOfficeInput = dialog.getByLabelText(
    /specify destination office/i,
  );
  fireEvent.change(customOfficeInput, { target: { value: "Research Office" } });
  expect(customOfficeInput).toHaveValue("Research Office");
});

test("renders origin and forwarded office selects with custom inputs for incoming requests", () => {
  render(<ControlledTransactionForm />);

  fireEvent.click(
    screen.getByRole("button", { name: /incoming from other office/i }),
  );
  const dialog = within(screen.getByRole("dialog"));
  const originSelect = dialog.getByRole("combobox", {
    name: /from office \(origin\)/i,
  });
  const forwardedSelect = dialog.getByRole("combobox", {
    name: /sent out \/ forwarded to/i,
  });

  fireEvent.change(originSelect, { target: { value: "Other" } });
  const originCustomInput = dialog.getByLabelText(/specify origin office/i);
  fireEvent.change(originCustomInput, { target: { value: "External Board" } });
  expect(originCustomInput).toHaveValue("External Board");

  fireEvent.change(forwardedSelect, { target: { value: "Other" } });
  const forwardedCustomInput = dialog.getByLabelText(
    /specify destination office/i,
  );
  fireEvent.change(forwardedCustomInput, {
    target: { value: "Legal Office" },
  });
  expect(forwardedCustomInput).toHaveValue("Legal Office");
});

test("sanitizes spreadsheet formula prefixes and quotes in CSV cells", () => {
  expect(csvValue("=CMD()")).toBe("\"'=CMD()\"");
  expect(csvValue("+1234")).toBe("\"'+1234\"");
  expect(csvValue("-1234")).toBe("\"'-1234\"");
  expect(csvValue("@SUM(A1:A2)")).toBe("\"'@SUM(A1:A2)\"");
  expect(csvValue("\tmalicious")).toBe("\"'\tmalicious\"");
  expect(csvValue('He said "hello"')).toBe('"He said ""hello"""');
  expect(csvValue(null)).toBe('""');
});
