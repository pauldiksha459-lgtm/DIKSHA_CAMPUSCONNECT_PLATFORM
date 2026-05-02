export const toCsv = (rows) => {
  if (!rows.length) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const escape = (value) =>
    `"${String(value ?? "")
      .replace(/"/g, "\"\"")
      .replace(/\n/g, " ")}"`;

  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(headers.map((header) => escape(row[header])).join(","));
  }

  return lines.join("\n");
};
