import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
    DownloadOptions,
    DownloadType,
    BaseDownloadConfig,
    ContactInfo,
    CalendarEvent
} from '../types/downloadTypes';

/**
 * BaseDownloadService - Core download functionality
 * Handles the fundamental download operations for different platforms
 */
export class BaseDownloadService {
    private config: BaseDownloadConfig;

    constructor(config: Partial<BaseDownloadConfig> = {}) {
        this.config = {
            maxRetries: 3,
            retryDelay: 1000,
            timeout: 30000,
            enableCache: true,
            enableNotifications: true,
            ...config
        };
    }

    /**
     * Main download method with platform detection
     */
    async download(options: DownloadOptions): Promise<boolean> {
        const { data, filename, mimeType, title } = options;

        try {
            if (Platform.OS === 'web') {
                return this.downloadWeb(data, filename, mimeType);
            } else {
                return this.downloadNative(data, filename, mimeType, title);
            }
        } catch (error) {
            console.error('BaseDownloadService.download error:', error);
            return false;
        }
    }

    /**
     * Download from URL with retry logic
     */
    async downloadFromUrl(url: string, filename: string, title?: string): Promise<boolean> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            try {
                if (Platform.OS === 'web') {
                    return this.downloadUrlWeb(url, filename);
                } else {
                    return this.downloadUrlNative(url, filename, title);
                }
            } catch (error) {
                lastError = error as Error;
                if (attempt < this.config.maxRetries) {
                    await this.delay(this.config.retryDelay * (attempt + 1));
                }
            }
        }

        console.error('Download from URL failed after retries:', lastError);
        return false;
    }

    /**
     * Download base64 data
     */
    async downloadBase64(
        base64: string,
        filename: string,
        mimeType?: string,
        title?: string
    ): Promise<boolean> {
        try {
            if (Platform.OS === 'web') {
                return this.downloadBase64Web(base64, filename, mimeType);
            } else {
                return this.downloadBase64Native(base64, filename, mimeType, title);
            }
        } catch (error) {
            console.error('Base64 download failed:', error);
            return false;
        }
    }

    /**
     * Prepare content based on data type and filename
     */
    prepareContent(data: any, filename: string): { content: string; mimeType: string } {
        const extension = filename.split('.').pop()?.toLowerCase();

        if (typeof data === 'string') {
            return {
                content: data,
                mimeType: this.getMimeType(extension || 'txt')
            };
        } else if (Array.isArray(data)) {
            if (extension === 'csv' || this.looksLikeCSV(data)) {
                return {
                    content: this.arrayToCSV(data),
                    mimeType: 'text/csv'
                };
            } else {
                return {
                    content: JSON.stringify(data, null, 2),
                    mimeType: 'application/json'
                };
            }
        } else if (typeof data === 'object' && data !== null) {
            return {
                content: JSON.stringify(data, null, 2),
                mimeType: 'application/json'
            };
        } else {
            return {
                content: String(data),
                mimeType: 'text/plain'
            };
        }
    }

    /**
     * Get MIME type from file extension
     */
    getMimeType(extension: string): string {
        const mimeTypes: { [key: string]: string } = {
            // Text
            'txt': 'text/plain',
            'csv': 'text/csv',
            'html': 'text/html',
            'xml': 'text/xml',
            'css': 'text/css',
            'js': 'application/javascript',
            'json': 'application/json',

            // Documents
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

            // Images
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'svg': 'image/svg+xml',
            'webp': 'image/webp',

            // Audio
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'ogg': 'audio/ogg',

            // Video
            'mp4': 'video/mp4',
            'webm': 'video/webm',
            'avi': 'video/x-msvideo',

            // Other
            'zip': 'application/zip',
            'ics': 'text/calendar',
            'vcf': 'text/vcard',
        };

        return mimeTypes[extension] || 'application/octet-stream';
    }

    /**
     * Create vCard content
     */
    createVCard(contact: ContactInfo): string {
        let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
        vcard += `FN:${contact.firstName}${contact.lastName ? ' ' + contact.lastName : ''}\n`;
        vcard += `N:${contact.lastName || ''};${contact.firstName};;;\n`;

        if (contact.email) vcard += `EMAIL:${contact.email}\n`;
        if (contact.phone) vcard += `TEL:${contact.phone}\n`;
        if (contact.organization) vcard += `ORG:${contact.organization}\n`;
        if (contact.title) vcard += `TITLE:${contact.title}\n`;
        if (contact.url) vcard += `URL:${contact.url}\n`;

        if (contact.address) {
            const { street, city, state, zip, country } = contact.address;
            vcard += `ADR:;;${street || ''};${city || ''};${state || ''};${zip || ''};${country || ''}\n`;
        }

        vcard += 'END:VCARD';
        return vcard;
    }

    /**
     * Create iCalendar content
     */
    createICS(event: CalendarEvent): string {
        const formatDate = (date: Date) => {
            return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        };

        const uid = `${Date.now()}@app.local`;
        const dtstamp = formatDate(new Date());

        let ics = 'BEGIN:VCALENDAR\n';
        ics += 'VERSION:2.0\n';
        ics += 'PRODID:-//App//Calendar//EN\n';
        ics += 'CALSCALE:GREGORIAN\n';
        ics += 'METHOD:PUBLISH\n';
        ics += 'BEGIN:VEVENT\n';
        ics += `UID:${uid}\n`;
        ics += `DTSTAMP:${dtstamp}\n`;
        ics += `DTSTART:${formatDate(event.startDate)}\n`;
        ics += `DTEND:${formatDate(event.endDate)}\n`;
        ics += `SUMMARY:${event.title}\n`;

        if (event.description) ics += `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\n`;
        if (event.location) ics += `LOCATION:${event.location}\n`;
        if (event.organizer) ics += `ORGANIZER:mailto:${event.organizer}\n`;
        if (event.url) ics += `URL:${event.url}\n`;

        if (event.attendees) {
            event.attendees.forEach(attendee => {
                ics += `ATTENDEE:mailto:${attendee}\n`;
            });
        }

        ics += 'END:VEVENT\n';
        ics += 'END:VCALENDAR';

        return ics;
    }

    // === PRIVATE METHODS ===

    private looksLikeCSV(data: any[]): boolean {
        return data.length > 0 && Array.isArray(data[0]);
    }

    private arrayToCSV(data: any[][]): string {
        return data.map(row => {
            return row.map(cell => {
                const cellStr = String(cell);
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(',');
        }).join('\n');
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // === WEB IMPLEMENTATION ===

    private downloadWeb(content: string, filename: string, mimeType?: string): boolean {
        try {
            const blob = new Blob([content], { type: mimeType || 'text/plain' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Web download failed:', error);
            return false;
        }
    }

    private downloadUrlWeb(url: string, filename: string): boolean {
        try {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return true;
        } catch (error) {
            console.error('Web URL download failed:', error);
            return false;
        }
    }

    private downloadBase64Web(base64: string, filename: string, mimeType?: string): boolean {
        try {
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType || 'application/octet-stream' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Web base64 download failed:', error);
            return false;
        }
    }

    // === NATIVE IMPLEMENTATION ===

    private async downloadNative(
        content: string,
        filename: string,
        mimeType?: string,
        title?: string
    ): Promise<boolean> {
        try {
            const fileUri = `${FileSystem.documentDirectory}${filename}`;

            await FileSystem.writeAsStringAsync(fileUri, content, {
                encoding: FileSystem.EncodingType.UTF8,
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: mimeType || 'application/octet-stream',
                    dialogTitle: title || `Save ${filename}`,
                });
                return true;
            }

            return false;
        } catch (error) {
            console.error('Native download failed:', error);
            return false;
        }
    }

    private async downloadUrlNative(
        url: string,
        filename: string,
        title?: string
    ): Promise<boolean> {
        try {
            const fileUri = `${FileSystem.documentDirectory}${filename}`;

            const downloadResult = await FileSystem.downloadAsync(url, fileUri);

            if (downloadResult.status !== 200) {
                throw new Error('Failed to download file');
            }

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    dialogTitle: title || `Save ${filename}`,
                });
                return true;
            }

            return false;
        } catch (error) {
            console.error('Native URL download failed:', error);
            return false;
        }
    }

    private async downloadBase64Native(
        base64: string,
        filename: string,
        mimeType?: string,
        title?: string
    ): Promise<boolean> {
        try {
            const fileUri = `${FileSystem.documentDirectory}${filename}`;

            await FileSystem.writeAsStringAsync(fileUri, base64, {
                encoding: FileSystem.EncodingType.Base64,
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: mimeType || 'application/octet-stream',
                    dialogTitle: title || `Save ${filename}`,
                });
                return true;
            }

            return false;
        } catch (error) {
            console.error('Native base64 download failed:', error);
            return false;
        }
    }
}