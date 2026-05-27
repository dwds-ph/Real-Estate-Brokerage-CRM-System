import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkeletonCard, SkeletonTable, SkeletonListItem } from "@/components/Skeleton";

describe("Skeleton", () => {
  describe("SkeletonCard", () => {
    it("should render Card skeleton", () => {
      const { container } = render(<SkeletonCard />);

      // Should have animate-pulse elements
      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);

      // Should render a card-like container
      const card = container.firstElementChild;
      expect(card?.className).toContain("rounded-lg");
    });
  });

  describe("SkeletonTable", () => {
    it("should render Table skeleton with default rows and cols", () => {
      const { container } = render(<SkeletonTable />);

      // Should have a table element
      const table = container.querySelector("table");
      expect(table).toBeInTheDocument();

      // Should render 5 rows (default)
      const rows = container.querySelectorAll("tr");
      // Header row + 5 body rows = 6
      expect(rows.length).toBe(6);

      // Should have animate-pulse cells
      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it("should render Table skeleton with custom rows and cols", () => {
      const { container } = render(<SkeletonTable rows={3} cols={2} />);

      const rows = container.querySelectorAll("tr");
      // Header row + 3 body rows = 4
      expect(rows.length).toBe(4);
    });
  });

  describe("SkeletonListItem", () => {
    it("should render List skeleton", () => {
      const { container } = render(<SkeletonListItem />);

      // Should have animate-pulse elements
      const pulseElements = container.querySelectorAll(".animate-pulse");
      expect(pulseElements.length).toBeGreaterThan(0);

      // Should have a rounded container
      const item = container.firstElementChild;
      expect(item?.className).toContain("rounded-lg");
    });
  });
});
