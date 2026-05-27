/* eslint-disable react-refresh/only-export-components */
import { memo, useMemo } from "react";
import { type AchievementBadge, type AchievementBadgeId } from "@/types";

// ─── All possible badges ────────────────────────────────────────────

export const ALL_BADGES: Record<
  AchievementBadgeId,
  { name: string; description: string; icon: string }
> = {
  "first-deal": {
    name: "First Deal",
    description: "Closed your first deal",
    icon: "🌟",
  },
  "million-club": {
    name: "Million-Peso Club",
    description: "Closed deals worth ₱1M+ total",
    icon: "💎",
  },
  "perfect-month": {
    name: "Perfect Month",
    description: "Closed 3+ deals in a single month",
    icon: "🏅",
  },
  "high-converter": {
    name: "High Converter",
    description: "Lead conversion rate above 50%",
    icon: "🎯",
  },
  "top-viewer": {
    name: "Top Viewer",
    description: "Conducted 20+ property viewings",
    icon: "👁️",
  },
  veteran: {
    name: "Veteran",
    description: "Closed 10+ deals total",
    icon: "🏆",
  },
  riser: {
    name: "Riser",
    description: "Highest month-over-month growth",
    icon: "📈",
  },
  "team-player": {
    name: "Team Player",
    description: "Participated in a co-broking deal",
    icon: "🤝",
  },
};

// ─── Badge Display Component ──────────────────────────────────────

export const BadgeDisplay = memo(function BadgeDisplay({
  badge,
}: {
  badge: AchievementBadge;
}) {
  return (
    <div
      className="group relative inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-muted/50 transition-colors cursor-default"
      title={badge.description}
    >
      <span className="text-lg">{badge.icon}</span>
      <div>
        <p className="text-xs font-medium">{badge.name}</p>
        <p className="text-[10px] text-muted-foreground">{badge.description}</p>
      </div>
    </div>
  );
});

// ─── Badge Gallery ──────────────────────────────────────────────────

export const BadgeGallery = memo(function BadgeGallery({
  badges,
}: {
  badges: AchievementBadge[];
}) {
  if (badges.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No achievements yet. Close deals to earn badges!
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {badges.map((badge) => (
        <BadgeDisplay key={badge.id} badge={badge} />
      ))}
    </div>
  );
});

// ─── Badge Library (all possible badges, earned vs locked) ─────────

export const BadgeLibrary = memo(function BadgeLibrary({
  earnedBadges,
}: {
  earnedBadges: AchievementBadgeId[];
}) {
  const entries = useMemo(
    () =>
      Object.entries(ALL_BADGES) as [
        AchievementBadgeId,
        (typeof ALL_BADGES)[AchievementBadgeId],
      ][],
    [],
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {entries.map(([id, def]) => {
        const earned = earnedBadges.includes(id);
        return (
          <div
            key={id}
            className={`rounded-lg border p-3 text-center transition-colors ${
              earned ? "bg-card border-primary/30" : "bg-muted/30 opacity-50"
            }`}
          >
            <span className={`text-2xl ${!earned ? "grayscale" : ""}`}>
              {def.icon}
            </span>
            <p className="text-xs font-medium mt-1">{def.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {earned ? "Earned ✓" : "Locked"}
            </p>
          </div>
        );
      })}
    </div>
  );
});
