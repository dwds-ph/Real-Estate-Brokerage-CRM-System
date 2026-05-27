import jsPDF from "jspdf";
import { formatCurrency } from "./utils";

export function generateListingSheetPdf(listing: any, agentName: string) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.text(listing.title || "Property Listing", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Generated for: ${agentName}`, pageWidth / 2, 28, { align: "center" });

  let y = 40;
  doc.setFontSize(12);

  const fields = [
    ["Price", formatCurrency(listing.price)],
    ["Property Type", listing.propertyType],
    ["Status", listing.status],
    ["Address", listing.address || listing.location || "—"],
    ["Description", listing.description || "—"],
  ];

  doc.setFont("helvetica", "bold");
  doc.text("Property Details", 14, y);
  doc.setFont("helvetica", "normal");
  y += 8;

  fields.forEach(([label, value]) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), 60, y);
    y += 6;
  });

  y += 10;
  doc.setFontSize(8);
  doc.text("This document is for informational purposes only. Subject to verification.", pageWidth / 2, y, { align: "center" });

  doc.save(`${listing.title?.replace(/\s+/g, "_") || "listing"}_sheet.pdf`);
}
