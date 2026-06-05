/**
 * tests/e2e/global-setup.ts
 *
 * Playwright global setup — runs once before all test workers.
 * Seeds the Firestore emulator with E2E test data and creates
 * Auth emulator users.
 *
 * This is referenced by playwright.config.ts -> globalSetup.
 */

import { seedTestUsers } from "../../e2e/helpers/auth";

/**
 * Executes Firestore seed script as a child process and creates
 * Auth emulator test users.
 */
async function globalSetup(): Promise<void> {
  console.log("\n[global-setup] 🔧 Starting E2E global setup...");

  // 1. Seed Firestore emulator data via the seed script
  const { execSync } = await import("child_process");
  try {
    console.log("[global-setup] 🌱 Seeding Firestore emulator data...");
    execSync("node scripts/seed-e2e-data.cjs", {
      stdio: "pipe",
      env: {
        ...process.env,
        FIRESTORE_EMULATOR_HOST: "localhost:8080",
        FIREBASE_AUTH_EMULATOR_HOST: "localhost:9099",
      },
    });
    console.log("[global-setup] ✅ Firestore seed data loaded");
  } catch (err) {
    console.error("[global-setup] ❌ Firestore seeding failed:", err);
    // Don't fail the whole test run — the seed may already be in place
    console.warn("[global-setup] ⚠️  Continuing despite seeding error (data may already exist)");
  }

  // 2. Create Auth emulator test users (broker + agent)
  try {
    console.log("[global-setup] 👤 Creating Auth emulator test users...");
    await seedTestUsers();
    console.log("[global-setup] ✅ Auth test users created");
  } catch (err) {
    console.error("[global-setup] ❌ Auth user creation failed:", err);
    console.warn("[global-setup] ⚠️  Continuing despite auth seeding error");
  }

  console.log("[global-setup] ✅ Global setup complete\n");
}

export default globalSetup;
