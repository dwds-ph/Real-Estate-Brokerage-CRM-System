import { createDoc } from "@/hooks/useFirestore";

export type NotificationType =
  | "lead"
  | "viewing"
  | "commission"
  | "task"
  | "mention"
  | "deal"
  | "general";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    link?: string;
    relatedId?: string;
  };
}

/**
 * Create a notification in the Firestore notifications collection.
 * Used for in-app notifications. For FCM push, the client-side
 * messaging service listens to the notifications collection.
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<string> {
  return createDoc("notifications", {
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    read: false,
    data: input.data || {},
    createdAt: Date.now(),
  });
}

/**
 * Convenience: create notifications for multiple users at once.
 */
export async function notifyUsers(
  userIds: string[],
  type: NotificationType,
  title: string,
  body: string,
  data?: { link?: string; relatedId?: string },
): Promise<string[]> {
  return Promise.all(
    userIds.map((userId) =>
      createNotification({ userId, type, title, body, data }),
    ),
  );
}

/**
 * Convenience: notify broker when something happens on an agent's account.
 */
export async function notifyBroker(
  brokerId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: { link?: string; relatedId?: string },
): Promise<string> {
  return createNotification({ userId: brokerId, type, title, body, data });
}

/**
 * Convenience: notify an agent.
 */
export async function notifyAgent(
  agentId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: { link?: string; relatedId?: string },
): Promise<string> {
  return createNotification({ userId: agentId, type, title, body, data });
}
