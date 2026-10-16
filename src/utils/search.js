export function normalizeQuery(search) {
  return String(search || "")
    .trim()
    .toLowerCase();
}

export function matchesQuery(search, ...values) {
  const query = normalizeQuery(search);
  if (!query) return true;
  return values.some((value) =>
    String(value || "")
      .toLowerCase()
      .includes(query),
  );
}
