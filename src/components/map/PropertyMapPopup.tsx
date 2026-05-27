import { formatCurrency } from "@/lib/utils";

interface ListingPopup {
  id?: string;
  title?: string;
  price?: number;
  propertyType?: string;
  address?: string;
  location?: string;
  images?: string[];
}

interface Props {
  listing: ListingPopup;
  onViewDetails?: (id: string) => void;
}

export default function PropertyMapPopup({ listing, onViewDetails }: Props) {
  return (
    <div className="text-sm min-w-[180px]">
      {listing.images?.[0] && (
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="w-full h-24 object-cover rounded mb-2"
        />
      )}
      <p className="font-semibold truncate">{listing.title}</p>
      <p className="text-primary font-medium">
        {formatCurrency(listing.price ?? 0)}
      </p>
      <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] mt-1 capitalize">
        {listing.propertyType?.replace("-", " ")}
      </span>
      <p className="text-xs text-muted-foreground mt-1 truncate">
        {listing.address || listing.location}
      </p>
      {onViewDetails && (
        <button
          onClick={() => listing.id && onViewDetails(listing.id)}
          className="mt-2 w-full rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
        >
          View Details
        </button>
      )}
    </div>
  );
}
