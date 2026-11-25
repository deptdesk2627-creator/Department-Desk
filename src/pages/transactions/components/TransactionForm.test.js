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

test("renders clean office select options and toggles + Others custom office input on outgoing request form", () => {
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
  expect(
    dialog.queryByRole("option", { name: "Other" }),
  ).not.toBeInTheDocument();

  fireEvent.change(officeSelect, { target: { value: "Registrar" } });
  expect(officeSelect).toHaveValue("Registrar");

  fireEvent.click(dialog.getByRole("button", { name: /^\+ others$/i }));
  const customOfficeInput = dialog.getByLabelText(
    /office \(where to go\) \(others\)/i,
  );
  fireEvent.change(customOfficeInput, { target: { value: "Research Office" } });
  expect(customOfficeInput).toHaveValue("Research Office");
});

test("toggles + Others custom inputs for origin and forwarded offices on incoming requests", () => {
  render(<ControlledTransactionForm />);

  fireEvent.click(
    screen.getByRole("button", { name: /incoming from other office/i }),
  );
  const dialog = within(screen.getByRole("dialog"));

  expect(
    dialog.getByRole("combobox", { name: /from office \(origin\)/i }),
  ).toBeInTheDocument();
  expect(
    dialog.getByRole("combobox", { name: /sent out \/ forwarded to/i }),
  ).toBeInTheDocument();

  fireEvent.click(
    dialog.getByRole("button", { name: /\+ others origin office/i }),
  );
  const originCustomInput = dialog.getByLabelText(
    /from office \(origin\) \(others\)/i,
  );
  fireEvent.change(originCustomInput, { target: { value: "External Board" } });
  expect(originCustomInput).toHaveValue("External Board");

  fireEvent.click(
    dialog.getByRole("button", { name: /\+ others forwarded office/i }),
  );
  const forwardedCustomInput = dialog.getByLabelText(
    /sent out \/ forwarded to \(others\)/i,
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
