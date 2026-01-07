import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import {
    CacheEntry,
    StorageQuota
} from '../types/downloadTypes';

/**
 * FileManagerService - Handles file system operations and caching
 * Manages file storage, caching, cleanup, and storage quota management
 */
export class FileManagerService {
    private cacheDirectory: string;
    private maxCacheSize: number; // in bytes
    private maxCacheAge: number; // in milliseconds
    private cache: Map<string, CacheEntry> = new Map();

    constructor(
        maxCacheSizeMB: number = 100,
        maxCacheAgeDays: number = 7
    ) {
        this.cacheDirectory = `${FileSystem.documentDirectory}downloads/cache/`;
        this.maxCacheSize = maxCacheSizeMB * 1024 * 1024; // Convert to bytes
        this.maxCacheAge = maxCacheAgeDays * 24 * 60 * 60 * 1000; // Convert to milliseconds

        this.initializeCache();
    }

    /**
     * Initialize cache directory and load existing cache entries
     */
    private async initializeCache(): Promise<void> {
        try {
            // Ensure cache directory exists
            const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });
            }

            // Load existing cache entries
            await this.loadCacheIndex();

            // Clean up expired entries
            await this.cleanupExpiredEntries();
        } catch (error) {
            console.error('Failed to initialize cache:', error);
        }
    }

    /**
     * Save file to cache
     */
    async saveToCache(
        key: string,
        content: string,
        mimeType: string,
        expirationDays?: number
    ): Promise<string | null> {
        try {
            const filename = this.sanitizeFilename(key);
            const filePath = `${this.cacheDirectory}${filename}`;

            // Write file
            await FileSystem.writeAsStringAsync(filePath, content, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            // Get file info
            const fileInfo = await FileSystem.getInfoAsync(filePath);

            const cacheEntry: CacheEntry = {
                key,
                filePath,
                mimeType,
                size: (fileInfo as any).size || 0,
                createdAt: new Date(),
                lastAccessed: new Date(),
                expiresAt: expirationDays
                    ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)
                    : undefined
            };

            this.cache.set(key, cacheEntry);
            await this.saveCacheIndex();

            // Check if we need to cleanup cache
            await this.enforceStorageLimits();

            return filePath;
        } catch (error) {
            console.error('Failed to save to cache:', error);
            return null;
        }
    }

    /**
     * Get file from cache
     */
    async getFromCache(key: string): Promise<string | null> {
        try {
            const cacheEntry = this.cache.get(key);
            if (!cacheEntry) return null;

            // Check if file exists
            const fileInfo = await FileSystem.getInfoAsync(cacheEntry.filePath);
            if (!fileInfo.exists) {
                this.cache.delete(key);
                await this.saveCacheIndex();
                return null;
            }

            // Check if expired
            if (cacheEntry.expiresAt && cacheEntry.expiresAt < new Date()) {
                await this.removeFromCache(key);
                return null;
            }

            // Update last accessed time
            cacheEntry.lastAccessed = new Date();
            this.cache.set(key, cacheEntry);

            // Read and return content
            const content = await FileSystem.readAsStringAsync(cacheEntry.filePath);
            return content;
        } catch (error) {
            console.error('Failed to get from cache:', error);
            return null;
        }
    }

    /**
     * Remove file from cache
     */
    async removeFromCache(key: string): Promise<boolean> {
        try {
            const cacheEntry = this.cache.get(key);
            if (!cacheEntry) return false;

            // Delete file
            const fileInfo = await FileSystem.getInfoAsync(cacheEntry.filePath);
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(cacheEntry.filePath);
            }

            // Remove from cache index
            this.cache.delete(key);
            await this.saveCacheIndex();

            return true;
        } catch (error) {
            console.error('Failed to remove from cache:', error);
            return false;
        }
    }

    /**
     * Clear entire cache
     */
    async clearCache(): Promise<boolean> {
        try {
            // Delete cache directory
            const dirInfo = await FileSystem.getInfoAsync(this.cacheDirectory);
            if (dirInfo.exists) {
                await FileSystem.deleteAsync(this.cacheDirectory);
            }

            // Recreate directory
            await FileSystem.makeDirectoryAsync(this.cacheDirectory, { intermediates: true });

            // Clear cache index
            this.cache.clear();
            await this.saveCacheIndex();

            return true;
        } catch (error) {
            console.error('Failed to clear cache:', error);
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    async getCacheStats(): Promise<{
        totalEntries: number;
        totalSize: number;
        oldestEntry?: Date;
        newestEntry?: Date;
    }> {
        const entries = Array.from(this.cache.values());

        const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
        const dates = entries.map(entry => entry.createdAt);

        return {
            totalEntries: entries.length,
            totalSize,
            oldestEntry: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : undefined,
            newestEntry: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : undefined
        };
    }

    /**
     * Get storage quota information
     */
    async getStorageQuota(): Promise<StorageQuota> {
        try {
            if (Platform.OS === 'web') {
                // Web storage quota (if supported)
                if ('storage' in navigator && 'estimate' in navigator.storage) {
                    const estimate = await navigator.storage.estimate();
                    return {
                        total: estimate.quota || 0,
                        used: estimate.usage || 0,
                        available: (estimate.quota || 0) - (estimate.usage || 0)
                    };
                }
            }

            // For native platforms, we can't get exact quota
            // Return cache size info instead
            const cacheStats = await this.getCacheStats();

            return {
                total: this.maxCacheSize,
                used: cacheStats.totalSize,
                available: this.maxCacheSize - cacheStats.totalSize
            };
        } catch (error) {
            console.error('Failed to get storage quota:', error);
            return {
                total: 0,
                used: 0,
                available: 0
            };
        }
    }

    /**
     * Create temporary file
     */
    async createTempFile(content: string, extension: string = 'tmp'): Promise<string | null> {
        try {
            const filename = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
            const filePath = `${FileSystem.documentDirectory}${filename}`;

            await FileSystem.writeAsStringAsync(filePath, content, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            return filePath;
        } catch (error) {
            console.error('Failed to create temp file:', error);
            return null;
        }
    }

    /**
     * Delete temporary file
     */
    async deleteTempFile(filePath: string): Promise<boolean> {
        try {
            const fileInfo = await FileSystem.getInfoAsync(filePath);
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(filePath);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to delete temp file:', error);
            return false;
        }
    }

    /**
     * Sanitize filename for safe storage
     */
    sanitizeFilename(filename: string): string {
        // Remove or replace invalid characters
        return filename
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_+|_+$/g, '')
            .substring(0, 255); // Limit length
    }

    /**
     * Get file extension from MIME type
     */
    getExtensionFromMimeType(mimeType: string): string {
        const mimeToExt: { [key: string]: string } = {
            'text/plain': 'txt',
            'text/csv': 'csv',
            'text/html': 'html',
            'application/json': 'json',
            'application/pdf': 'pdf',
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'audio/mpeg': 'mp3',
            'video/mp4': 'mp4',
            'application/zip': 'zip',
            'text/calendar': 'ics',
            'text/vcard': 'vcf'
        };

        return mimeToExt[mimeType] || 'bin';
    }

    // === PRIVATE METHODS ===

    private async loadCacheIndex(): Promise<void> {
        try {
            const indexPath = `${this.cacheDirectory}index.json`;
            const fileInfo = await FileSystem.getInfoAsync(indexPath);

            if (fileInfo.exists) {
                const indexContent = await FileSystem.readAsStringAsync(indexPath);
                const cacheData = JSON.parse(indexContent);

                // Convert date strings back to Date objects
                Object.entries(cacheData).forEach(([key, entry]: [string, any]) => {
                    this.cache.set(key, {
                        ...entry,
                        createdAt: new Date(entry.createdAt),
                        lastAccessed: new Date(entry.lastAccessed),
                        expiresAt: entry.expiresAt ? new Date(entry.expiresAt) : undefined
                    });
                });
            }
        } catch (error) {
            console.error('Failed to load cache index:', error);
        }
    }

    private async saveCacheIndex(): Promise<void> {
        try {
            const indexPath = `${this.cacheDirectory}index.json`;
            const cacheData = Object.fromEntries(this.cache);

            await FileSystem.writeAsStringAsync(indexPath, JSON.stringify(cacheData, null, 2));
        } catch (error) {
            console.error('Failed to save cache index:', error);
        }
    }

    private async cleanupExpiredEntries(): Promise<void> {
        const now = new Date();
        const expiredKeys: string[] = [];

        for (const [key, entry] of this.cache.entries()) {
            // Check if expired by date
            if (entry.expiresAt && entry.expiresAt < now) {
                expiredKeys.push(key);
                continue;
            }

            // Check if expired by age
            const age = now.getTime() - entry.createdAt.getTime();
            if (age > this.maxCacheAge) {
                expiredKeys.push(key);
            }
        }

        // Remove expired entries
        for (const key of expiredKeys) {
            await this.removeFromCache(key);
        }
    }

    private async enforceStorageLimits(): Promise<void> {
        const stats = await this.getCacheStats();

        if (stats.totalSize <= this.maxCacheSize) return;

        // Sort entries by last accessed time (oldest first)
        const entries = Array.from(this.cache.entries())
            .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

        // Remove oldest entries until under limit
        let currentSize = stats.totalSize;
        for (const [key, entry] of entries) {
            if (currentSize <= this.maxCacheSize) break;

            await this.removeFromCache(key);
            currentSize -= entry.size;
        }
    }
}