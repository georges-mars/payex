import {
    DownloadProgress,
    DownloadNotification
} from '../types/downloadTypes';

/**
 * ProgressTrackingService - Handles download progress monitoring and notifications
 * Manages progress state, notifications, and background download support
 */
export class ProgressTrackingService {
    private activeDownloads: Map<string, DownloadProgress> = new Map();
    private progressCallbacks: Map<string, (progress: DownloadProgress) => void> = new Map();
    private notificationCallbacks: ((notification: DownloadNotification) => void)[] = [];
    private enableNotifications: boolean = true;

    constructor(enableNotifications: boolean = true) {
        this.enableNotifications = enableNotifications;
    }

    /**
     * Start tracking a new download
     */
    startTracking(
        id: string,
        filename: string,
        totalBytes?: number,
        onProgress?: (progress: DownloadProgress) => void
    ): void {
        const progress: DownloadProgress = {
            id,
            filename,
            totalBytes,
            downloadedBytes: 0,
            progress: 0,
            status: 'pending',
            startTime: new Date()
        };

        this.activeDownloads.set(id, progress);

        if (onProgress) {
            this.progressCallbacks.set(id, onProgress);
        }

        this.notifyProgress(progress);
        this.showNotification({
            id: `${id}-start`,
            title: 'Download Started',
            message: `Starting download of ${filename}`,
            type: 'info'
        });
    }

    /**
     * Update download progress
     */
    updateProgress(id: string, downloadedBytes: number, status?: DownloadProgress['status']): void {
        const progress = this.activeDownloads.get(id);
        if (!progress) return;

        progress.downloadedBytes = downloadedBytes;

        if (progress.totalBytes) {
            progress.progress = Math.round((downloadedBytes / progress.totalBytes) * 100);
        }

        if (status) {
            progress.status = status;
        }

        this.activeDownloads.set(id, progress);
        this.notifyProgress(progress);

        // Show progress notification for downloads > 1MB
        if (progress.totalBytes && progress.totalBytes > 1024 * 1024) {
            this.showNotification({
                id: `${id}-progress`,
                title: 'Downloading...',
                message: `${progress.filename} - ${progress.progress}%`,
                progress: progress.progress,
                type: 'progress'
            });
        }
    }

    /**
     * Mark download as completed
     */
    completeDownload(id: string, success: boolean, error?: string): void {
        const progress = this.activeDownloads.get(id);
        if (!progress) return;

        progress.status = success ? 'completed' : 'failed';
        progress.endTime = new Date();
        progress.progress = success ? 100 : progress.progress;

        if (error) {
            progress.error = error;
        }

        this.activeDownloads.set(id, progress);
        this.notifyProgress(progress);

        // Show completion notification
        this.showNotification({
            id: `${id}-complete`,
            title: success ? 'Download Complete' : 'Download Failed',
            message: success
                ? `${progress.filename} downloaded successfully`
                : `Failed to download ${progress.filename}: ${error || 'Unknown error'}`,
            type: success ? 'success' : 'error'
        });

        // Clean up after a delay
        setTimeout(() => {
            this.cleanupDownload(id);
        }, 30000); // Keep for 30 seconds
    }

    /**
     * Cancel a download
     */
    cancelDownload(id: string): void {
        const progress = this.activeDownloads.get(id);
        if (!progress) return;

        progress.status = 'cancelled';
        progress.endTime = new Date();

        this.activeDownloads.set(id, progress);
        this.notifyProgress(progress);

        this.showNotification({
            id: `${id}-cancel`,
            title: 'Download Cancelled',
            message: `${progress.filename} download was cancelled`,
            type: 'info'
        });

        this.cleanupDownload(id);
    }

    /**
     * Get progress for a specific download
     */
    getProgress(id: string): DownloadProgress | undefined {
        return this.activeDownloads.get(id);
    }

    /**
     * Get all active downloads
     */
    getAllActiveDownloads(): DownloadProgress[] {
        return Array.from(this.activeDownloads.values())
            .filter(progress => progress.status === 'downloading' || progress.status === 'pending');
    }

    /**
     * Get download history (completed, failed, cancelled)
     */
    getDownloadHistory(): DownloadProgress[] {
        return Array.from(this.activeDownloads.values())
            .filter(progress => ['completed', 'failed', 'cancelled'].includes(progress.status))
            .sort((a, b) => (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0));
    }

    /**
     * Clear download history
     */
    clearHistory(): void {
        const activeIds = this.getAllActiveDownloads().map(p => p.id);

        // Keep only active downloads
        const newMap = new Map();
        activeIds.forEach(id => {
            const progress = this.activeDownloads.get(id);
            if (progress) {
                newMap.set(id, progress);
            }
        });

        this.activeDownloads = newMap;
    }

    /**
     * Subscribe to progress updates
     */
    onProgress(callback: (progress: DownloadProgress) => void): () => void {
        const id = Math.random().toString(36);
        this.progressCallbacks.set(id, callback);

        return () => {
            this.progressCallbacks.delete(id);
        };
    }

    /**
     * Subscribe to notifications
     */
    onNotification(callback: (notification: DownloadNotification) => void): () => void {
        this.notificationCallbacks.push(callback);

        return () => {
            const index = this.notificationCallbacks.indexOf(callback);
            if (index > -1) {
                this.notificationCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Get download statistics
     */
    getStatistics(): {
        totalDownloads: number;
        completedDownloads: number;
        failedDownloads: number;
        totalBytesDownloaded: number;
        averageDownloadTime: number;
    } {
        const allDownloads = Array.from(this.activeDownloads.values());
        const completed = allDownloads.filter(p => p.status === 'completed');
        const failed = allDownloads.filter(p => p.status === 'failed');

        const totalBytes = completed.reduce((sum, p) => sum + (p.totalBytes || 0), 0);

        const downloadTimes = completed
            .filter(p => p.endTime && p.startTime)
            .map(p => p.endTime!.getTime() - p.startTime.getTime());

        const averageTime = downloadTimes.length > 0
            ? downloadTimes.reduce((sum, time) => sum + time, 0) / downloadTimes.length
            : 0;

        return {
            totalDownloads: allDownloads.length,
            completedDownloads: completed.length,
            failedDownloads: failed.length,
            totalBytesDownloaded: totalBytes,
            averageDownloadTime: averageTime
        };
    }

    /**
     * Enable or disable notifications
     */
    setNotificationsEnabled(enabled: boolean): void {
        this.enableNotifications = enabled;
    }

    // === PRIVATE METHODS ===

    private notifyProgress(progress: DownloadProgress): void {
        // Notify specific callback for this download
        const callback = this.progressCallbacks.get(progress.id);
        if (callback) {
            callback(progress);
        }

        // Notify all general progress callbacks
        this.progressCallbacks.forEach((callback, key) => {
            if (key !== progress.id) {
                callback(progress);
            }
        });
    }

    private showNotification(notification: DownloadNotification): void {
        if (!this.enableNotifications) return;

        this.notificationCallbacks.forEach(callback => {
            callback(notification);
        });
    }

    private cleanupDownload(id: string): void {
        this.activeDownloads.delete(id);
        this.progressCallbacks.delete(id);
    }

    /**
     * Generate unique download ID
     */
    static generateDownloadId(): string {
        return `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Format bytes for display
     */
    static formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format download speed
     */
    static formatSpeed(bytesPerSecond: number): string {
        return `${this.formatBytes(bytesPerSecond)}/s`;
    }

    /**
     * Estimate remaining time
     */
    static estimateRemainingTime(
        downloadedBytes: number,
        totalBytes: number,
        startTime: Date
    ): string {
        if (downloadedBytes === 0 || totalBytes === 0) return 'Unknown';

        const elapsedMs = Date.now() - startTime.getTime();
        const bytesPerMs = downloadedBytes / elapsedMs;
        const remainingBytes = totalBytes - downloadedBytes;
        const remainingMs = remainingBytes / bytesPerMs;

        const remainingSeconds = Math.round(remainingMs / 1000);

        if (remainingSeconds < 60) {
            return `${remainingSeconds}s`;
        } else if (remainingSeconds < 3600) {
            return `${Math.round(remainingSeconds / 60)}m`;
        } else {
            return `${Math.round(remainingSeconds / 3600)}h`;
        }
    }
}