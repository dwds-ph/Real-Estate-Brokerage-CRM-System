import { formatCurrency } from "@/lib/utils";
import { generateListingSheetPdf } from "@/lib/syndication";

interface ListingSheetData {
  id?: string;
  title?: string;
  price?: number;
  propertyType?: string;
  status?: string;
  address?: string;
  location?: string;
  description?: string;
}

interface Props {
  listing: ListingSheetData;
  agentName: string;
}

export default function ListingSheet({ listing, agentName }: Props) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <h4 className="font-semibold text-sm">{listing.title}</h4>
        <p className="text-2xl font-bold text-primary">
          {formatCurrency(listing.price ?? 0)}
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>
            <span className="font-medium">Type:</span> {listing.propertyType}
          </div>
          <div>
            <span className="font-medium">Status:</span> {listing.status}
          </div>
          <div className="col-span-2">
            <span className="font-medium">Address:</span>{" "}
            {listing.address || listing.location || "—"}
          </div>
          {listing.description && (
            <div className="col-span-2">
              <span className="font-medium">Description:</span>{" "}
              {listing.description}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={() => generateListingSheetPdf(listing, agentName)}
        className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        📄 Download PDF Sheet
      </button>
    </div>
  );
}
