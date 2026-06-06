/**
 * Lead Deduplication Engine
 *
 * Deduplicates leads by phone → email → name+fuzzy address.
 * Designed for Facebook lead import to prevent duplicate entries.
 */

import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Lead } from "@/types";

export interface DedupResult {
  /** Whether a duplicate was found */
  isDuplicate: boolean;
  /** The matching lead ID if duplicate found */
  existingLeadId?: string;
  /** Match confidence: "exact" | "high" | "medium" | "low" */
  confidence: "exact" | "high" | "medium" | "low" | "none";
  /** How the match was made (for logging) */
  matchMethod: "phone" | "email" | "name_address" | "none";
}

/**
 * Normalize a phone number for comparison.
 * Strips all non-digit characters and leading country codes.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Remove leading country code(s): +63, 63, 0
  if (digits.startsWith("63") && digits.length > 10) {
    return digits.slice(2);
  }
  if (digits.startsWith("0") && digits.length > 10) {
    return digits.slice(1);
  }
  return digits;
}

/**
 * Normalize email for comparison (lowercase, trim).
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Compute a simple name similarity score (0–1).
 * Uses normalized substring/word overlap.
 */
export function nameSimilarity(nameA: string, nameB: string): number {
  const a = nameA.toLowerCase().trim().replace(/\s+/g, " ");
  const b = nameB.toLowerCase().trim().replace(/\s+/g, " ");

  if (a === b) {return 1;}
  if (a.includes(b) || b.includes(a)) {return 0.8;}

  const wordsA = a.split(" ");
  const wordsB = b.split(" ");
  const intersection = wordsA.filter((w) => wordsB.includes(w));
  if (intersection.length > 0) {
    return intersection.length / Math.max(wordsA.length, wordsB.length);
  }
  return 0;
}

/**
 * Normalize address for fuzzy comparison.
 */
export function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[,.#]/g, "")
    .replace(/\b(st|street|brgy|barangay|city|town|province)\b/g, "")
    .trim();
}

/**
 * Check if two addresses match fuzzily.
 */
export function addressMatch(addrA?: string, addrB?: string): boolean {
  if (!addrA || !addrB) {return false;}
  const a = normalizeAddress(addrA);
  const b = normalizeAddress(addrB);
  if (a === b) {return true;}
  return a.includes(b) || b.includes(a);
}

/**
 * Deduplicate an incoming lead against existing leads in Firestore.
 *
 * Matching priority:
 * 1. Phone (exact normalized match)
 * 2. Email (exact case-insensitive match)
 * 3. Name + Address (fuzzy match)
 */
export async function deduplicateLead(
  incomingLead: {
    phone?: string;
    email?: string;
    name?: string;
    location?: string;
  },
): Promise<DedupResult> {
  // Priority 1: Phone match
  if (incomingLead.phone) {
    const normalizedPhone = normalizePhone(incomingLead.phone);
    if (normalizedPhone.length >= 7) {
      const leadsRef = collection(db, "leads");
      const phoneQuery = query(
        leadsRef,
        where("phone", "==", incomingLead.phone),
        limit(1),
      );
      const phoneSnap = await getDocs(phoneQuery);
      if (!phoneSnap.empty) {
        const existing = phoneSnap.docs[0];
        return {
          isDuplicate: true,
          existingLeadId: existing.id,
          confidence: "exact",
          matchMethod: "phone",
        };
      }
    }
  }

  // Priority 2: Email match
  if (incomingLead.email) {
    const leadsRef = collection(db, "leads");
    const emailQuery = query(
      leadsRef,
      where("email", "==", incomingLead.email),
      limit(1),
    );
    const emailSnap = await getDocs(emailQuery);
    if (!emailSnap.empty) {
      const existing = emailSnap.docs[0];
      return {
        isDuplicate: true,
        existingLeadId: existing.id,
        confidence: "exact",
        matchMethod: "email",
      };
    }
  }

  // Priority 3: Name + Address fuzzy match
  if (incomingLead.name && incomingLead.name.length >= 3) {
    const leadsRef = collection(db, "leads");
    // Fetch recent leads to compare against (limit for performance)
    const allQuery = query(leadsRef, limit(200));
    const allSnap = await getDocs(allQuery);

    for (const docSnap of allSnap.docs) {
      const existing = docSnap.data() as Lead;
      const nameScore = nameSimilarity(
        incomingLead.name,
        existing.name || "",
      );

      if (nameScore >= 0.8 && incomingLead.location && existing.location) {
        if (addressMatch(incomingLead.location, existing.location)) {
          return {
            isDuplicate: true,
            existingLeadId: docSnap.id,
            confidence: "high",
            matchMethod: "name_address",
          };
        }
      }

      if (nameScore >= 1.0) {
        // Exact name match but no address — still flag as possible duplicate
        return {
          isDuplicate: true,
          existingLeadId: docSnap.id,
          confidence: "medium",
          matchMethod: "name_address",
        };
      }
    }
  }

  return {
    isDuplicate: false,
    confidence: "none",
    matchMethod: "none",
  };
}

/**
 * Merge two lead records when a duplicate is detected.
 * Keeps the existing lead's core fields, fills in missing data
 * from the incoming lead.
 */
export function mergeLeadData(
  existing: Partial<Lead>,
  incoming: Partial<Lead>,
): Partial<Lead> {
  const merged: Partial<Lead> = { ...existing };

  // Only fill missing fields from incoming
  if (!existing.phone && incoming.phone) {merged.phone = incoming.phone;}
  if (!existing.email && incoming.email) {merged.email = incoming.email;}
  if (!existing.location && incoming.location) {merged.location = incoming.location;}
  if (!existing.propertyInterest && incoming.propertyInterest) {
    merged.propertyInterest = incoming.propertyInterest;
  }
  if (!existing.budget && incoming.budget) {merged.budget = incoming.budget;}
  if (!existing.notes && incoming.notes) {
    merged.notes = existing.notes
      ? `${existing.notes}\n---\n${incoming.notes}`
      : incoming.notes;
  }

  return merged;
}

/**
 * Check if a phone number already exists in the leads collection.
 * Used by import UI to show real-time duplicate warnings.
 */
export async function checkPhoneExists(
  phone: string,
): Promise<string | null> {
  const normalized = normalizePhone(phone);
  if (normalized.length < 7) {return null;}

  const leadsRef = collection(db, "leads");
  const q = query(leadsRef, where("phone", "==", phone), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) {return null;}
  return snap.docs[0].id;
}

/**
 * Check if an email already exists in the leads collection.
 */
export async function checkEmailExists(
  email: string,
): Promise<string | null> {
  const leadsRef = collection(db, "leads");
  const q = query(leadsRef, where("email", "==", email), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) {return null;}
  return snap.docs[0].id;
}
