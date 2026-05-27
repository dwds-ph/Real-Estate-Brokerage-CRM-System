import ImportWizard from "@/components/import/ImportWizard";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulk Import</h1>
        <p className="text-sm text-muted-foreground">
          Import leads, listings, and projects from CSV files
        </p>
      </div>
      <ImportWizard />
    </div>
  );
}
