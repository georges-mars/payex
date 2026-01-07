import { BaseDownloadService } from './BaseDownloadService';
import { ProgressTrackingService } from './ProgressTrackingService';
import { FileManagerService } from './FileManagerService';
import { DownloadValidatorService } from './DownloadValidatorService';
import {
    DownloadOptions,
    ContactInfo,
    CalendarEvent,
    BaseDownloadConfig,
    DownloadProgress,
    DownloadNotification
} from '../types/downloadTypes';

/**
 * DownloadManager - Orchestrates all download services
 *
 * A comprehensive download utility that provides:
 * - Multiple download types (text, JSON, CSV, HTML, vCard, iCalendar, URLs, base64)
 * - Progress tracking and notifications
 * - File validation and security checks
 * - Caching and file management
 * - Cross-platform support (web + native)
 *
 * Usage Examples:
 *
 * // Simple text download
 * await DownloadManager.saveText("Hello World", "greeting.txt")
 *
 * // JSON with progress tracking
 * const downloadId = await DownloadManager.saveJSON(data, "data.json", {
 *   onProgress: (progress) => console.log(`${progress.progress}%`)
 * })
 *
 * // Download from URL with validation
 * await DownloadManager.saveFromUrl("https://example.com/file.pdf", "document.pdf")
 */
export class DownloadManager {
    private baseService: BaseDownloadService;
    private progressService: ProgressTrackingService;
    private fileService: FileManagerService;
    private validatorService: DownloadValidatorService;

    constructor(config: Partial<BaseDownloadConfig & {
        maxCacheSizeMB?: number;
        maxCacheAgeDays?: number;
        maxFileSizeMB?: number;
        allowedMimeTypes?: string[];
        blockedExtensions?: string[];
    }> = {}) {
        this.baseService = new BaseDownloadService(config);
        this.progressService = new ProgressTrackingService(config.enableNotifications);
        this.fileService = new FileManagerService(config.maxCacheSizeMB, config.maxCacheAgeDays);
        this.validatorService = new DownloadValidatorService(
            config.maxFileSizeMB,
            config.allowedMimeTypes,
            config.blockedExtensions
        );
    }

    /**
     * Main save method - intelligently handles any data type
     */
    static async save(data: any, filename: string, title?: string): Promise<string | boolean> {
        const manager = new DownloadManager();
        return manager.save(data, filename, title);
    }

    /**
     * Instance method for save with full configuration
     */
    async save(
        data: any,
        filename: string,
        title?: string,
        options?: {
            onProgress?: (progress: DownloadProgress) => void;
            enableCache?: boolean;
            validateContent?: boolean;
        }
    ): Promise<string | boolean> {
        const downloadId = ProgressTrackingService.generateDownloadId();

        try {
            // Prepare content
            const { content, mimeType } = this.baseService.prepareContent(data, filename);

            // Validate if requested
            if (options?.validateContent !== false) {
                const validation = this.validatorService.validateFile(
                    filename,
                    mimeType,
                    content.length,
                    content
                );

                if (!validation.isValid) {
                    this.progressService.completeDownload(downloadId, false, validation.error);
                    return false;
                }

                filename = validation.sanitizedFilename || filename;
            }

            // Start progress tracking
            this.progressService.startTracking(
                downloadId,
                filename,
                content.length,
                options?.onProgress
            );

            // Check cache first
            if (options?.enableCache !== false) {
                const cacheKey = this.generateCacheKey(content, filename);
                const cachedPath = await this.fileService.getFromCache(cacheKey);

                if (cachedPath) {
                    this.progressService.completeDownload(downloadId, true);
                    return downloadId;
                }
            }

            // Perform download
            const success = await this.baseService.download({
                data: content,
                filename,
                mimeType,
                title
            });

            // Update progress
            this.progressService.updateProgress(downloadId, content.length, 'downloading');

            // Cache if successful and caching enabled
            if (success && options?.enableCache !== false) {
                const cacheKey = this.generateCacheKey(content, filename);
                await this.fileService.saveToCache(cacheKey, content, mimeType);
            }

            this.progressService.completeDownload(downloadId, success);
            return success ? downloadId : false;
        } catch (error) {
            this.progressService.completeDownload(
                downloadId,
                false,
                error instanceof Error ? error.message : 'Unknown error'
            );
            return false;
        }
    }

    // === STATIC CONVENIENCE METHODS ===

    /**
     * Save plain text content
     */
    static async saveText(text: string, filename: string = 'download.txt'): Promise<string | boolean> {
        return this.save(text, filename);
    }

    /**
     * Save JSON data
     */
    static async saveJSON(data: any, filename: string = 'data.json'): Promise<string | boolean> {
        const jsonFilename = filename.endsWith('.json') ? filename : filename + '.json';
        return this.save(data, jsonFilename);
    }

    /**
     * Save CSV data
     */
    static async saveCSV(rows: any[][], filename: string = 'data.csv'): Promise<boolean> {
        const manager = new DownloadManager();
        const csvContent = manager.baseService.prepareContent(rows, filename);

        return manager.baseService.download({
            data: csvContent.content,
            filename: filename.endsWith('.csv') ? filename : filename + '.csv',
            mimeType: 'text/csv'
        });
    }

    /**
     * Save HTML content
     */
    static async saveHTML(html: string, filename: string = 'page.html'): Promise<boolean> {
        const htmlFilename = filename.endsWith('.html') ? filename : filename + '.html';

        const manager = new DownloadManager();
        return manager.baseService.download({
            data: html,
            filename: htmlFilename,
            mimeType: 'text/html'
        });
    }

    /**
     * Save vCard (contact) file
     */
    static async saveVCard(contact: ContactInfo, filename: string = 'contact.vcf'): Promise<boolean> {
        const manager = new DownloadManager();
        const vcardContent = manager.baseService.createVCard(contact);

        return manager.baseService.download({
            data: vcardContent,
            filename: filename.endsWith('.vcf') ? filename : filename + '.vcf',
            mimeType: 'text/vcard'
        });
    }

    /**
     * Save calendar event (ICS) file
     */
    static async saveCalendarEvent(event: CalendarEvent, filename: string = 'event.ics'): Promise<boolean> {
        const manager = new DownloadManager();
        const icsContent = manager.baseService.createICS(event);

        return manager.baseService.download({
            data: icsContent,
            filename: filename.endsWith('.ics') ? filename : filename + '.ics',
            mimeType: 'text/calendar'
        });
    }

    /**
     * Save content from URL
     */
    static async saveFromUrl(url: string, filename: string, title?: string): Promise<boolean> {
        const manager = new DownloadManager();

        // Validate URL
        const validation = manager.validatorService.validateUrl(url);
        if (!validation.isValid) {
            console.error('URL validation failed:', validation.error);
            return false;
        }

        return manager.baseService.downloadFromUrl(url, filename, title);
    }

    /**
     * Save base64 encoded data
     */
    static async saveBase64(
        base64: string,
        filename: string,
        mimeType?: string,
        title?: string
    ): Promise<boolean> {
        const manager = new DownloadManager();

        // Validate base64
        const validation = manager.validatorService.validateBase64(base64, filename, mimeType);
        if (!validation.isValid) {
            console.error('Base64 validation failed:', validation.error);
            return false;
        }

        return manager.baseService.downloadBase64(base64, filename, mimeType, title);
    }

    // === INSTANCE METHODS FOR ADVANCED USAGE ===

    /**
     * Download with full options and progress tracking
     */
    async download(options: DownloadOptions & {
        onProgress?: (progress: DownloadProgress) => void;
        enableCache?: boolean;
        validateContent?: boolean;
    }): Promise<string | boolean> {
        return this.save(options.data, options.filename, options.title, {
            onProgress: options.onProgress,
            enableCache: options.enableCache,
            validateContent: options.validateContent
        });
    }

    /**
     * Get download progress
     */
    getProgress(downloadId: string): DownloadProgress | undefined {
        return this.progressService.getProgress(downloadId);
    }

    /**
     * Cancel download
     */
    cancelDownload(downloadId: string): void {
        this.progressService.cancelDownload(downloadId);
    }

    /**
     * Get all active downloads
     */
    getActiveDownloads(): DownloadProgress[] {
        return this.progressService.getAllActiveDownloads();
    }

    /**
     * Get download history
     */
    getDownloadHistory(): DownloadProgress[] {
        return this.progressService.getDownloadHistory();
    }

    /**
     * Clear download history
     */
    clearHistory(): void {
        this.progressService.clearHistory();
    }

    /**
     * Subscribe to progress updates
     */
    onProgress(callback: (progress: DownloadProgress) => void): () => void {
        return this.progressService.onProgress(callback);
    }

    /**
     * Subscribe to notifications
     */
    onNotification(callback: (notification: DownloadNotification) => void): () => void {
        return this.progressService.onNotification(callback);
    }

    /**
     * Get cache statistics
     */
    async getCacheStats() {
        return this.fileService.getCacheStats();
    }

    /**
     * Clear cache
     */
    async clearCache(): Promise<boolean> {
        return this.fileService.clearCache();
    }

    /**
     * Get storage quota information
     */
    async getStorageQuota() {
        return this.fileService.getStorageQuota();
    }

    /**
     * Get download statistics
     */
    getStatistics() {
        return this.progressService.getStatistics();
    }

    // === PRIVATE METHODS ===

    private generateCacheKey(content: string, filename: string): string {
        // Simple hash function for cache key
        let hash = 0;
        const str = content + filename;

        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return `download_${Math.abs(hash)}_${filename}`;
    }
}

// Export static methods for backward compatibility
export const saveText = DownloadManager.saveText.bind(DownloadManager);
export const saveJSON = DownloadManager.saveJSON.bind(DownloadManager);
export const saveCSV = DownloadManager.saveCSV.bind(DownloadManager);
export const saveHTML = DownloadManager.saveHTML.bind(DownloadManager);
export const saveVCard = DownloadManager.saveVCard.bind(DownloadManager);
export const saveCalendarEvent = DownloadManager.saveCalendarEvent.bind(DownloadManager);
export const saveFromUrl = DownloadManager.saveFromUrl.bind(DownloadManager);
export const saveBase64 = DownloadManager.saveBase64.bind(DownloadManager);

// Export as default for backward compatibility
export default DownloadManager;