export interface UserSession {
  id: string;
  userId: string;
  deviceInfo: string; // navigator.userAgent
  ipAddress?: string;
  createdAt: number;
  lastActiveAt: number;
  isActive: boolean;
  // For session revocation
  revokedAt?: number;
  revokedBy?: string;
}
