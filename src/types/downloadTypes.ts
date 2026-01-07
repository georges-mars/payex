/**
 * Type definitions for download services
 */

export interface DownloadOptions {
    data: any;
    filename: string;
    mimeType?: string;
    title?: string;
}

export interface DownloadProgress {
    id: string;
    filename: string;
    totalBytes?: number;
    downloadedBytes: number;
    progress: number; // 0-100
    status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
    error?: string;
    startTime: Date;
    endTime?: Date;
}

export interface FileValidationResult {
    isValid: boolean;
    error?: string;
    sanitizedFilename?: string;
    detectedMimeType?: string;
}

export interface CacheEntry {
    key: string;
    filePath: string;
    mimeType: string;
    size: number;
    createdAt: Date;
    lastAccessed: Date;
    expiresAt?: Date;
}

export interface StorageQuota {
    total: number;
    used: number;
    available: number;
}

export interface ContactInfo {
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    organization?: string;
    title?: string;
    url?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
}

export interface CalendarEvent {
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    organizer?: string;
    attendees?: string[];
    url?: string;
}

export interface DownloadNotification {
    id: string;
    title: string;
    message: string;
    progress?: number;
    type: 'info' | 'success' | 'error' | 'progress';
}

export type DownloadType = 'text' | 'json' | 'csv' | 'html' | 'vcard' | 'ics' | 'url' | 'base64' | 'binary';

export interface BaseDownloadConfig {
    maxRetries: number;
    retryDelay: number;
    timeout: number;
    enableCache: boolean;
    enableNotifications: boolean;
}