import { format, addDays } from "date-fns";

interface InvoiceExportData {
  id: string;
  amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  customerName: string;
  jobTitle: string;
  projectName: string;
}

// Escapes values for CSV compliance (wraps in quotes if commas/quotes exist)
function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Generate QuickBooks Online CSV
export function generateQuickBooksCSV(invoices: InvoiceExportData[]): string {
  const headers = [
    "InvoiceNo",
    "Customer",
    "InvoiceDate",
    "DueDate",
    "ProductService",
    "Description",
    "Quantity",
    "Rate",
    "Amount"
  ];

  const rows = invoices.map((inv) => {
    const invDate = new Date(inv.created_at);
    const dueDate = addDays(invDate, 30); // 30-day payment term

    return [
      escapeCSV(inv.id.substring(0, 8).toUpperCase()), // Short reference ID
      escapeCSV(inv.customerName),
      escapeCSV(format(invDate, "MM/dd/yyyy")),
      escapeCSV(format(dueDate, "MM/dd/yyyy")),
      escapeCSV("Service Revenue"), // Default Product/Service
      escapeCSV(`FSM Job: ${inv.jobTitle} (Project: ${inv.projectName})`),
      "1",
      escapeCSV(inv.amount.toFixed(2)),
      escapeCSV(inv.amount.toFixed(2))
    ];
  });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

// Generate Xero CSV
export function generateXeroCSV(invoices: InvoiceExportData[]): string {
  const headers = [
    "*ContactName",
    "*InvoiceNumber",
    "*InvoiceDate",
    "*DueDate",
    "*Description",
    "*Quantity",
    "*UnitAmount",
    "*AccountCode",
    "*TaxType"
  ];

  const rows = invoices.map((inv) => {
    const invDate = new Date(inv.created_at);
    const dueDate = addDays(invDate, 30);

    return [
      escapeCSV(inv.customerName),
      escapeCSV(inv.id.substring(0, 8).toUpperCase()),
      escapeCSV(format(invDate, "MM/dd/yyyy")),
      escapeCSV(format(dueDate, "MM/dd/yyyy")),
      escapeCSV(`FSM Job: ${inv.jobTitle} (Project: ${inv.projectName})`),
      "1",
      escapeCSV(inv.amount.toFixed(2)),
      "200", // Standard Sales revenue Account Code
      "Tax Exempt" // Standard Xero tax type
    ];
  });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

// Helper to trigger the file download in browser
export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
