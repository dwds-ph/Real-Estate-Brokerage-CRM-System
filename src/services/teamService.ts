import { where, orderBy } from "firebase/firestore";
import {
  subscribeToQuery,
  createDocument,
  updateDocument,
  deleteDocument,
  COLLECTIONS,
} from "@/lib/firestore";
import type { AgentTeam } from "@/types";

export function subscribeTeams(brokerId: string | undefined, callback: (items: AgentTeam[]) => void) {
  if (!brokerId) return () => {};
  return subscribeToQuery<AgentTeam>(
    COLLECTIONS.TEAMS,
    [where("brokerId", "==", brokerId), orderBy("name", "asc")],
    callback,
  );
}

export async function createTeam(data: Omit<AgentTeam, "id" | "createdAt" | "updatedAt">) {
  return createDocument<AgentTeam>(COLLECTIONS.TEAMS, data);
}

export async function updateTeam(id: string, data: Partial<AgentTeam>) {
  return updateDocument<AgentTeam>(COLLECTIONS.TEAMS, id, data);
}

export async function deleteTeam(id: string) {
  return deleteDocument(COLLECTIONS.TEAMS, id);
}
