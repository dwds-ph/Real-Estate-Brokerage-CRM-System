import { formatCurrency } from "@/lib/utils";

interface CMAReportSubject {
  title?: string;
  propertyType?: string;
  size?: number;
  price?: number;
  pricePerSqm?: number;
}

interface CMAReportComparable {
  title?: string;
  address?: string;
  size?: number;
  price?: number;
  pricePerSqm?: number;
  adjustment?: number;
  adjustedPrice?: number;
}

interface CMAReportData {
  subject?: CMAReportSubject;
  subjectProperty?: CMAReportSubject;
  comparables?: CMAReportComparable[];
  adjustedRange?: { min?: number; max?: number };
  recommendedPrice?: number;
}

interface Props {
  report: CMAReportData | null;
}

export default function CMAReport({ report }: Props) {
  if (!report) {return null;}

  return (
    <div className="space-y-3">
      {/* Subject Property */}
      <div className="rounded-lg border bg-card p-4">
        <h4 className="text-sm font-medium mb-2">Subject Property</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Name:</span>{" "}
            {report.subject?.title || report.subjectProperty?.title}
          </div>
          <div>
            <span className="text-muted-foreground">Type:</span>{" "}
            {report.subject?.propertyType ||
              report.subjectProperty?.propertyType}
          </div>
          <div>
            <span className="text-muted-foreground">Size:</span>{" "}
            {report.subject?.size || report.subjectProperty?.size} sqm
          </div>
          <div>
            <span className="text-muted-foreground">Price:</span>{" "}
            {formatCurrency(
              report.subject?.price ?? report.subjectProperty?.price ?? 0,
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Price/sqm:</span>{" "}
            {formatCurrency(
              report.subject?.pricePerSqm ??
                report.subjectProperty?.pricePerSqm ??
                0,
            )}
          </div>
        </div>
      </div>

      {/* Comparables */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-3 py-2 bg-muted">
          <h4 className="text-sm font-medium">Comparable Properties</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-1.5 text-left">Address</th>
                <th className="px-2 py-1.5 text-right">Size</th>
                <th className="px-2 py-1.5 text-right">Price</th>
                <th className="px-2 py-1.5 text-right">₱/sqm</th>
                <th className="px-2 py-1.5 text-right">Adj.</th>
                <th className="px-2 py-1.5 text-right">Adj. Price</th>
              </tr>
            </thead>
            <tbody>
              {report.comparables?.map((c: CMAReportComparable, i: number) => (
                <tr key={i} className="border-t">
                  <td className="px-2 py-1.5">{c.title || c.address || "—"}</td>
                  <td className="px-2 py-1.5 text-right">{c.size}</td>
                  <td className="px-2 py-1.5 text-right">
                    {formatCurrency(c.price ?? 0)}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {formatCurrency(c.pricePerSqm ?? 0)}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    {c.adjustment || 0}%
                  </td>
                  <td className="px-2 py-1.5 text-right font-medium">
                    {formatCurrency(c.adjustedPrice ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendation */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Low Range</p>
          <p className="font-bold">
            {formatCurrency(report.adjustedRange?.min || 0)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground">High Range</p>
          <p className="font-bold">
            {formatCurrency(report.adjustedRange?.max || 0)}
          </p>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Recommended</p>
          <p className="font-bold text-primary">
            {formatCurrency(report.recommendedPrice || 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
