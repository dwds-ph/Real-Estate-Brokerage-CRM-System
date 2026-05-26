import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function generateId(): string {
  return doc(db, '_', '_').id;
}

// Lazy import to avoid circular dep
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function getLeadStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    viewed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    negotiating: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    closed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getScoreColor(score: string): string {
  const colors: Record<string, string> = {
    hot: 'text-red-600 dark:text-red-400',
    warm: 'text-yellow-600 dark:text-yellow-400',
    cold: 'text-blue-600 dark:text-blue-400',
  };
  return colors[score] || '';
}

export function getListingStatusColor(status: string): string {
  const colors: Record<string, string> = {
    available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'under-option': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    sold: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    rented: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'off-market': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
