import {
  doc,
  collection,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserSession } from "@/types";

// ─── Session Document Path ────────────────────────────────────────────

function sessionDoc(userId: string, sessionId: string) {
  return doc(db, "users", userId, "sessions", sessionId);
}

function sessionsCol(userId: string) {
  return collection(db, "users", userId, "sessions");
}

// ─── Start a new session ──────────────────────────────────────────────

export async function startSession(userId: string): Promise<string> {
  const deviceInfo =
    typeof window !== "undefined" ? window.navigator.userAgent : "unknown";
  const now = Date.now();
  const docRef = await addDoc(sessionsCol(userId), {
    userId,
    deviceInfo,
    createdAt: now,
    lastActiveAt: now,
    isActive: true,
  });
  return docRef.id;
}

// ─── Heartbeat (update lastActiveAt) ──────────────────────────────────

export async function updateHeartbeat(
  userId: string,
  sessionId: string,
): Promise<void> {
  await updateDoc(sessionDoc(userId, sessionId), {
    lastActiveAt: Date.now(),
  });
}

// ─── End session (soft logout) ────────────────────────────────────────

export async function endSession(
  userId: string,
  sessionId: string,
): Promise<void> {
  await updateDoc(sessionDoc(userId, sessionId), {
    isActive: false,
    lastActiveAt: Date.now(),
  });
}

// ─── Revoke session (broker action) ───────────────────────────────────

export async function revokeSession(
  userId: string,
  sessionId: string,
  revokedBy: string,
): Promise<void> {
  await updateDoc(sessionDoc(userId, sessionId), {
    isActive: false,
    revokedAt: Date.now(),
    revokedBy,
  });
}

// ─── Get active sessions for a user ───────────────────────────────────

export async function getActiveSessions(
  userId: string,
): Promise<UserSession[]> {
  const q = query(
    sessionsCol(userId),
    where("isActive", "==", true),
    orderBy("lastActiveAt", "desc"),
    limit(50),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = { id: d.id, ...d.data() } as unknown as UserSession;
    return data;
  });
}

// ─── Get ALL active sessions for all agents in a broker's org ────────

export async function getAllSessionsForBroker(
  brokerId: string,
): Promise<UserSession[]> {
  // Query all users under this broker
  const usersSnap = await getDocs(
    query(
      collection(db, "users"),
      where("brokerId", "==", brokerId),
      where("isActive", "==", true),
    ),
  );

  const allSessions: UserSession[] = [];
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const q = query(
      sessionsCol(uid),
      where("isActive", "==", true),
      orderBy("lastActiveAt", "desc"),
      limit(20),
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      allSessions.push({ id: d.id, ...d.data() } as unknown as UserSession);
    }
  }

  // Sort by lastActiveAt descending
  allSessions.sort((a, b) => b.lastActiveAt - a.lastActiveAt);
  return allSessions;
}
