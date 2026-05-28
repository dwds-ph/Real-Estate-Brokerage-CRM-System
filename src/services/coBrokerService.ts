import { where, orderBy } from "firebase/firestore";
import { subscribeToQuery, createDocument, updateDocument, deleteDocument, COLLECTIONS } from "@/lib/firestore";
import type { CoBroker, CoBrokerDeal } from "@/types";

export function subscribeCoBrokers(brokerId: string | undefined, callback: (items: CoBroker[]) => void) {
  if (!brokerId) {return () => {};}
  return subscribeToQuery<CoBroker>(
    COLLECTIONS.CO_BROKERS,
    [where("brokerId", "==", brokerId), orderBy("name", "asc")],
    callback,
  );
}

export function subscribeCoBrokerDeals(brokerId: string | undefined, callback: (items: CoBrokerDeal[]) => void) {
  if (!brokerId) {return () => {};}
  return subscribeToQuery<CoBrokerDeal>(
    COLLECTIONS.CO_BROKER_DEALS,
    [where("brokerId", "==", brokerId), orderBy("createdAt", "desc")],
    callback,
  );
}

export async function createCoBroker(data: Omit<CoBroker, "id" | "createdAt" | "updatedAt">) {
  return createDocument<CoBroker>(COLLECTIONS.CO_BROKERS, data as unknown as Omit<CoBroker, "id">);
}

export async function updateCoBroker(id: string, data: Partial<CoBroker>) {
  await updateDocument<CoBroker>(COLLECTIONS.CO_BROKERS, id, data);
}

export async function deleteCoBroker(id: string) {
  await deleteDocument(COLLECTIONS.CO_BROKERS, id);
}

export async function createCoBrokerDeal(data: Omit<CoBrokerDeal, "id" | "createdAt" | "updatedAt">) {
  return createDocument<CoBrokerDeal>(COLLECTIONS.CO_BROKER_DEALS, data as unknown as Omit<CoBrokerDeal, "id">);
}

export async function updateCoBrokerDeal(id: string, data: Partial<CoBrokerDeal>) {
  await updateDocument<CoBrokerDeal>(COLLECTIONS.CO_BROKER_DEALS, id, data);
}
