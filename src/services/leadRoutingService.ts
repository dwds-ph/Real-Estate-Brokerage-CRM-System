import {
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppUser, Lead } from '@/types';

export interface LeadRoutingRule {
  type: 'round-robin' | 'specialty' | 'location';
  agentIds?: string[];
  currentIndex?: number;
  specialtyMap?: Record<string, string>;
  locationMap?: Record<string, string>;
}

export interface RoutingConfig {
  enabled: boolean;
  rules: LeadRoutingRule[];
}

const CONFIG_DOC_ID = 'leadRoutingConfig';
const CONFIG_COLLECTION = 'routingConfigs';

export async function getRoutingConfig(): Promise<RoutingConfig | null> {
  const { getDoc } = await import('firebase/firestore');
  const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
  const snap = await getDoc(docRef);
  if (snap.exists()) return snap.data() as RoutingConfig;
  return null;
}

export async function saveRoutingConfig(config: RoutingConfig): Promise<void> {
  const { setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID), config);
}

export async function findNextAgent(config: RoutingConfig, lead: Partial<Lead>, _allAgents: AppUser[]): Promise<string | null> {
  if (!config.enabled || config.rules.length === 0) return null;

  for (const rule of config.rules) {
    if (rule.type === 'specialty' && rule.specialtyMap && lead.propertyInterest) {
      const interest = lead.propertyInterest.toLowerCase();
      for (const [key, agentId] of Object.entries(rule.specialtyMap)) {
        if (interest.includes(key.toLowerCase())) return agentId;
      }
    }

    if (rule.type === 'location' && rule.locationMap && lead.location) {
      const loc = lead.location.toLowerCase();
      for (const [key, agentId] of Object.entries(rule.locationMap)) {
        if (loc.includes(key.toLowerCase())) return agentId;
      }
    }
  }

  // Round-robin fallback
  const roundRobinRule = config.rules.find((r) => r.type === 'round-robin');
  if (roundRobinRule && roundRobinRule.agentIds && roundRobinRule.agentIds.length > 0) {
    const idx = roundRobinRule.currentIndex ?? 0;
    const nextAgent = roundRobinRule.agentIds[idx % roundRobinRule.agentIds.length];
    roundRobinRule.currentIndex = (idx + 1) % roundRobinRule.agentIds.length;
    await saveRoutingConfig(config);
    return nextAgent;
  }

  return null;
}

export async function autoAssignLead(leadId: string, leadData: Partial<Lead>, allAgents: AppUser[]): Promise<void> {
  const config = await getRoutingConfig();
  if (!config || !config.enabled) return;

  const assignedTo = await findNextAgent(config, leadData, allAgents);
  if (assignedTo) {
    await updateDoc(doc(db, 'leads', leadId), { assignedTo });
  }
}
