import { formatCurrency, formatDate, formatDateTime } from "./formatters";

test("formats dates and date-times and handles missing or invalid values", () => {
  const date = new Date("2026-01-15T13:04:00.000Z");

  expect(formatDate(date)).toBe(
    date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }),
  );
  expect(formatDateTime(date)).toBe(
    date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
  );
  expect(formatDate("")).toBe("—");
  expect(formatDateTime(null)).toBe("—");
  expect(formatDate("not a date")).toBe("not a date");
});

test("formats Philippine peso amounts and rejects non-numeric values", () => {
  expect(formatCurrency(1234.5)).toBe(
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(1234.5),
  );
  expect(formatCurrency(Number.NaN)).toBe("—");
});
