export interface CMAInput {
  subject: {
    id: string;
    title: string;
    propertyType: string;
    price: number;
    size: number;
    address?: string;
    location?: string;
  };
  comparables: {
    id: string;
    title: string;
    price: number;
    size: number;
    address?: string;
    location?: string;
    propertyType: string;
  }[];
}

export interface CMAOutput {
  subject: CMAInput["subject"] & { pricePerSqm: number };
  comps: (CMAInput["comparables"][number] & {
    pricePerSqm: number;
    distance: string;
    adjustment: number;
    adjustedPrice: number;
  })[];
  adjustedRange: { min: number; max: number };
  recommendedPrice: number;
}

export function computeCMA(input: CMAInput): CMAOutput {
  const subject = {
    ...input.subject,
    pricePerSqm:
      input.subject.size > 0 ? input.subject.price / input.subject.size : 0,
  };

  const comps = input.comparables.map((c) => {
    const pricePerSqm = c.size > 0 ? c.price / c.size : 0;
    const diff =
      subject.pricePerSqm > 0
        ? (pricePerSqm - subject.pricePerSqm) / subject.pricePerSqm
        : 0;
    const adjustment = diff * 0.5; // 50% weight on difference
    const adjustedPrice = c.price * (1 - adjustment);
    return {
      ...c,
      pricePerSqm,
      distance: "\u2014",
      adjustment: Math.round(adjustment * 100),
      adjustedPrice,
    };
  });

  const prices = comps.map((c) => c.adjustedPrice).filter((p) => p > 0);
  const min = prices.length > 0 ? Math.min(...prices) : subject.price * 0.9;
  const max = prices.length > 0 ? Math.max(...prices) : subject.price * 1.1;

  const recommendedPrice =
    prices.length > 0
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : subject.price;

  return {
    subject,
    comps,
    adjustedRange: { min, max },
    recommendedPrice: Math.round(recommendedPrice / 10000) * 10000,
  };
}
