import { useState } from "react";
import type { CoBroker } from "@/types";

interface Props {
  initial?: CoBroker;
  onSubmit: (data: {
    name: string;
    brokerage: string;
    licenseNumber?: string;
    phone: string;
    email?: string;
    address?: string;
    referralFeeRate?: number;
  }) => void;
  onCancel: () => void;
}

export default function CoBrokerForm({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name || "");
  const [brokerage, setBrokerage] = useState(initial?.brokerage || "");
  const [licenseNumber, setLicenseNumber] = useState(
    initial?.licenseNumber || "",
  );
  const [phone, setPhone] = useState(initial?.phone || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [referralFeeRate, setReferralFeeRate] = useState(
    initial?.referralFeeRate || 0,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      brokerage,
      licenseNumber: licenseNumber || undefined,
      phone,
      email: email || undefined,
      address: address || undefined,
      referralFeeRate: referralFeeRate || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="cobroker-name"
            className="block text-xs font-medium mb-1"
          >
            Name *
          </label>
          <input
            id="cobroker-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
            required
          />
        </div>
        <div>
          <label
            htmlFor="cobroker-brokerage"
            className="block text-xs font-medium mb-1"
          >
            Brokerage *
          </label>
          <input
            id="cobroker-brokerage"
            type="text"
            value={brokerage}
            onChange={(e) => setBrokerage(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
            required
          />
        </div>
        <div>
          <label
            htmlFor="cobroker-phone"
            className="block text-xs font-medium mb-1"
          >
            Phone *
          </label>
          <input
            id="cobroker-phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
            required
          />
        </div>
        <div>
          <label
            htmlFor="cobroker-license"
            className="block text-xs font-medium mb-1"
          >
            License #
          </label>
          <input
            id="cobroker-license"
            type="text"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="cobroker-email"
            className="block text-xs font-medium mb-1"
          >
            Email
          </label>
          <input
            id="cobroker-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="cobroker-fee"
            className="block text-xs font-medium mb-1"
          >
            Referral Fee %
          </label>
          <input
            id="cobroker-fee"
            type="number"
            value={referralFeeRate}
            onChange={(e) => setReferralFeeRate(Number(e.target.value))}
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="cobroker-address"
          className="block text-xs font-medium mb-1"
        >
          Address
        </label>
        <input
          id="cobroker-address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
        >
          {initial ? "Update" : "Add"} Co-Broker
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-1.5 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
