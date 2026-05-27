import { Page, request } from "@playwright/test";

// ─── Firebase Emulator Auth ─────────────────────────────────────────
// The Firebase Auth emulator runs at localhost:9099 by default.
// We use the emulator's REST API to create and authenticate test users.

const AUTH_EMULATOR_URL = "http://127.0.0.1:9099";
const TEST_BROKER = {
  email: "broker@test.ph",
  password: "TestBroker123!",
  displayName: "Test Broker",
  role: "broker",
};

const TEST_AGENT = {
  email: "agent@test.ph",
  password: "TestAgent123!",
  displayName: "Test Agent",
  role: "agent",
};

/**
 * Create a test user in the Firebase Auth emulator via REST API.
 * The emulator accepts unsigned requests for testing.
 */
export async function createAuthUser(
  email: string,
  password: string,
): Promise<{ localId: string; idToken: string }> {
  const api = await request.newContext();
  const res = await api.post(
    `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      data: { email, password, returnSecureToken: true },
    },
  );
  const body = await res.json();
  if (res.status() >= 400) {
    // User may already exist — try signIn instead
    const signInRes = await api.post(
      `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
      { data: { email, password, returnSecureToken: true } },
    );
    const signInBody = await signInRes.json();
    return { localId: signInBody.localId, idToken: signInBody.idToken };
  }
  return { localId: body.localId, idToken: body.idToken };
}

/**
 * Sign in an existing user via the Auth emulator REST API.
 */
export async function signInUser(
  email: string,
  password: string,
): Promise<{ localId: string; idToken: string }> {
  const api = await request.newContext();
  const res = await api.post(
    `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
    { data: { email, password, returnSecureToken: true } },
  );
  const body = await res.json();
  return { localId: body.localId, idToken: body.idToken };
}

/**
 * Create a Firestore user document for an authenticated test user.
 * Uses the Firestore emulator REST API.
 */
export async function createUserDocument(
  userId: string,
  data: Record<string, unknown>,
): Promise<void> {
  const api = await request.newContext();
  await api.patch(
    `http://127.0.0.1:8080/v1/projects/demo-crm/databases/(default)/documents/users/${userId}`,
    {
      data: {
        fields: mapToFirestoreFields({
          ...data,
          isActive: true,
          createdAt: Date.now(),
        }),
      },
    },
  );
}

/**
 * Set a custom claim on a user via the Auth emulator REST API.
 */
export async function setCustomClaims(
  localId: string,
  claims: Record<string, unknown>,
): Promise<void> {
  const api = await request.newContext();
  await api.post(
    `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:update?key=fake-api-key`,
    {
      data: { localId, customAttributes: JSON.stringify(claims) },
    },
  );
}

/**
 * Seed the Firebase Auth emulator with standard test users.
 * Call once in global setup or beforeAll.
 */
export async function seedTestUsers(): Promise<{
  broker: { localId: string; idToken: string };
  agent: { localId: string; idToken: string };
}> {
  const broker = await createAuthUser(TEST_BROKER.email, TEST_BROKER.password);
  const agent = await createAuthUser(TEST_AGENT.email, TEST_AGENT.password);

  await setCustomClaims(broker.localId, { role: "broker" });
  await setCustomClaims(agent.localId, { role: "agent" });

  await createUserDocument(broker.localId, {
    displayName: TEST_BROKER.displayName,
    email: TEST_BROKER.email,
    role: "broker",
  });
  await createUserDocument(agent.localId, {
    displayName: TEST_AGENT.displayName,
    email: TEST_AGENT.email,
    role: "agent",
    brokerId: broker.localId,
  });

  return { broker, agent };
}

/**
 * Log a test user into the app by setting Firebase Auth emulator tokens
 * in localStorage (the app's AuthContext reads from onAuthStateChanged,
 * which picks up emulator state automatically when the emulator is connected).
 *
 * Simpler approach: navigate to login page, fill in credentials, submit.
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for redirect to dashboard
  await page.waitForURL("**/dashboard", { timeout: 10_000 });
}

/**
 * Map a plain JS object to Firestore REST API fields format.
 */
function mapToFirestoreFields(obj: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      fields[key] = { stringValue: value };
    } else if (typeof value === "number") {
      fields[key] = { integerValue: Math.floor(value) };
    } else if (typeof value === "boolean") {
      fields[key] = { booleanValue: value };
    } else if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: { values: value.map((v) => ({ stringValue: String(v) })) },
      };
    } else if (typeof value === "object") {
      fields[key] = { mapValue: { fields: mapToFirestoreFields(value as Record<string, unknown>) } };
    }
  }
  return fields;
}

export const TEST_USERS = { broker: TEST_BROKER, agent: TEST_AGENT };
