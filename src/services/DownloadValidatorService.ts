import {FileValidationResult} from '../types/downloadTypes';

/**
 * DownloadValidatorService - Handles file validation and security checks
 * Validates file types, sizes, content, and performs security checks
 */
export class DownloadValidatorService {
    private maxFileSize: number; // in bytes
    private allowedMimeTypes: Set<string>;
    private blockedExtensions: Set<string>;
    private maxFilenameLength: number;

    constructor(
        maxFileSizeMB: number = 100,
        allowedMimeTypes?: string[],
        blockedExtensions?: string[]
    ) {
        this.maxFileSize = maxFileSizeMB * 1024 * 1024; // Convert to bytes
        this.maxFilenameLength = 255;

        // Default allowed MIME types (if not specified, allow common safe types)
        this.allowedMimeTypes = new Set(allowedMimeTypes || [
            // Text
            'text/plain',
            'text/csv',
            'text/html',
            'text/xml',
            'text/css',
            'text/calendar',
            'text/vcard',

            // Documents
            'application/json',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

            // Images
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/svg+xml',
            'image/webp',

            // Audio
            'audio/mpeg',
            'audio/wav',
            'audio/ogg',

            // Video
            'video/mp4',
            'video/webm',
            'video/quicktime',

            // Archives
            'application/zip',
            'application/x-zip-compressed'
        ]);

        // Default blocked extensions (security risk)
        this.blockedExtensions = new Set(blockedExtensions || [
            'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
            'app', 'deb', 'pkg', 'rpm', 'dmg', 'iso', 'msi', 'dll'
        ]);
    }

    /**
     * Validate file before download
     */
    validateFile(
        filename: string,
        mimeType?: string,
        contentSize?: number,
        content?: string
    ): FileValidationResult {
        try {
            // Sanitize filename
            const sanitizedFilename = this.sanitizeFilename(filename);

            // Validate filename
            const filenameValidation = this.validateFilename(sanitizedFilename);
            if (!filenameValidation.isValid) {
                return filenameValidation;
            }

            // Validate file extension
            const extensionValidation = this.validateExtension(sanitizedFilename);
            if (!extensionValidation.isValid) {
                return extensionValidation;
            }

            // Validate MIME type
            if (mimeType) {
                const mimeValidation = this.validateMimeType(mimeType);
                if (!mimeValidation.isValid) {
                    return mimeValidation;
                }
            }

            // Validate file size
            if (contentSize !== undefined) {
                const sizeValidation = this.validateFileSize(contentSize);
                if (!sizeValidation.isValid) {
                    return sizeValidation;
                }
            }

            // Validate content if provided
            if (content) {
                const contentValidation = this.validateContent(content, mimeType);
                if (!contentValidation.isValid) {
                    return contentValidation;
                }
            }

            // Detect MIME type from content if not provided
            let detectedMimeType = mimeType;
            if (!detectedMimeType && content) {
                detectedMimeType = this.detectMimeType(content, sanitizedFilename);
            }

            return {
                isValid: true,
                sanitizedFilename,
                detectedMimeType
            };
        } catch (error) {
            return {
                isValid: false,
                error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Validate URL before downloading
     */
    validateUrl(url: string): FileValidationResult {
        try {
            // Basic URL validation
            const urlObj = new URL(url);

            // Check protocol
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return {
                    isValid: false,
                    error: 'Only HTTP and HTTPS URLs are allowed'
                };
            }

            // Check for suspicious patterns
            if (this.containsSuspiciousPatterns(url)) {
                return {
                    isValid: false,
                    error: 'URL contains suspicious patterns'
                };
            }

            // Extract filename from URL
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop() || 'download';

            // Validate extracted filename
            return this.validateFilename(filename);
        } catch (error) {
            return {
                isValid: false,
                error: 'Invalid URL format'
            };
        }
    }

    /**
     * Validate base64 content
     */
    validateBase64(base64: string, filename: string, mimeType?: string): FileValidationResult {
        try {
            // Check if it's valid base64
            if (!this.isValidBase64(base64)) {
                return {
                    isValid: false,
                    error: 'Invalid base64 encoding'
                };
            }

            // Calculate decoded size
            const decodedSize = this.calculateBase64Size(base64);

            // Validate size
            const sizeValidation = this.validateFileSize(decodedSize);
            if (!sizeValidation.isValid) {
                return sizeValidation;
            }

            // Validate filename and MIME type
            return this.validateFile(filename, mimeType, decodedSize);
        } catch (error) {
            return {
                isValid: false,
                error: `Base64 validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Sanitize filename for safe usage
     */
    sanitizeFilename(filename: string): string {
        return filename
                // Remove path separators
                .replace(/[/\\]/g, '')
                // Replace invalid characters with underscore
                .replace(/[<>:"|?*]/g, '_')
                // Replace multiple spaces with single underscore
                .replace(/\s+/g, '_')
                // Replace multiple underscores with single
                .replace(/_{2,}/g, '_')
                // Remove leading/trailing underscores and dots
                .replace(/^[._]+|[._]+$/g, '')
            // Ensure it's not empty
            || 'download'
                // Limit length
                .substring(0, this.maxFilenameLength);
    }

    /**
     * Check if content appears to be malicious
     */
    scanForMaliciousContent(content: string, mimeType?: string): FileValidationResult {
        try {
            // Check for script injection patterns
            if (this.containsScriptInjection(content)) {
                return {
                    isValid: false,
                    error: 'Content contains potentially malicious scripts'
                };
            }

            // Check for suspicious URLs
            if (this.containsSuspiciousUrls(content)) {
                return {
                    isValid: false,
                    error: 'Content contains suspicious URLs'
                };
            }

            // MIME-specific checks
            if (mimeType) {
                const mimeSpecificValidation = this.validateMimeSpecificContent(content, mimeType);
                if (!mimeSpecificValidation.isValid) {
                    return mimeSpecificValidation;
                }
            }

            return {isValid: true};
        } catch (error) {
            return {
                isValid: false,
                error: `Content scan error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    // === PRIVATE VALIDATION METHODS ===

    private validateFilename(filename: string): FileValidationResult {
        if (!filename || filename.trim().length === 0) {
            return {
                isValid: false,
                error: 'Filename cannot be empty'
            };
        }

        if (filename.length > this.maxFilenameLength) {
            return {
                isValid: false,
                error: `Filename too long (max ${this.maxFilenameLength} characters)`
            };
        }

        // Check for reserved names (Windows)
        const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
        const nameWithoutExt = filename.split('.')[0].toUpperCase();

        if (reservedNames.includes(nameWithoutExt)) {
            return {
                isValid: false,
                error: 'Filename uses reserved system name'
            };
        }

        return {isValid: true};
    }

    private validateExtension(filename: string): FileValidationResult {
        const extension = filename.split('.').pop()?.toLowerCase();

        if (!extension) {
            return {isValid: true}; // Allow files without extensions
        }

        if (this.blockedExtensions.has(extension)) {
            return {
                isValid: false,
                error: `File extension '.${extension}' is not allowed for security reasons`
            };
        }

        return {isValid: true};
    }

    private validateMimeType(mimeType: string): FileValidationResult {
        if (!this.allowedMimeTypes.has(mimeType)) {
            return {
                isValid: false,
                error: `MIME type '${mimeType}' is not allowed`
            };
        }

        return {isValid: true};
    }

    private validateFileSize(size: number): FileValidationResult {
        if (size > this.maxFileSize) {
            const maxSizeMB = Math.round(this.maxFileSize / (1024 * 1024));
            const actualSizeMB = Math.round(size / (1024 * 1024));

            return {
                isValid: false,
                error: `File size (${actualSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
            };
        }

        return {isValid: true};
    }

    private validateContent(content: string, mimeType?: string): FileValidationResult {
        // Check content size
        const contentSize = new Blob([content]).size;
        const sizeValidation = this.validateFileSize(contentSize);
        if (!sizeValidation.isValid) {
            return sizeValidation;
        }

        // Scan for malicious content
        return this.scanForMaliciousContent(content, mimeType);
    }

    private detectMimeType(content: string, filename: string): string {
        const extension = filename.split('.').pop()?.toLowerCase();

        // Try to detect from content patterns
        if (content.startsWith('data:')) {
            const match = content.match(/^data:([^;]+)/);
            if (match) return match[1];
        }

        if (content.startsWith('<?xml') || content.startsWith('<html')) {
            return 'text/html';
        }

        if (content.startsWith('{') || content.startsWith('[')) {
            try {
                JSON.parse(content);
                return 'application/json';
            } catch {
                // Not valid JSON
            }
        }

        // Fall back to extension-based detection
        const mimeTypes: { [key: string]: string } = {
            'txt': 'text/plain',
            'csv': 'text/csv',
            'html': 'text/html',
            'json': 'application/json',
            'xml': 'text/xml'
        };

        return mimeTypes[extension || ''] || 'text/plain';
    }

    private isValidBase64(str: string): boolean {
        try {
            return btoa(atob(str)) === str;
        } catch {
            return false;
        }
    }

    private calculateBase64Size(base64: string): number {
        // Remove data URL prefix if present
        const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, '');

        // Calculate decoded size
        const padding = (cleanBase64.match(/=/g) || []).length;
        return Math.floor((cleanBase64.length * 3) / 4) - padding;
    }

    private containsSuspiciousPatterns(text: string): boolean {
        const suspiciousPatterns = [
            /javascript:/i,
            /vbscript:/i,
            /data:text\/html/i,
            /data:application\/x-msdownload/i,
            /<script/i,
            /eval\s*\(/i,
            /document\.write/i,
            /window\.location/i
        ];

        return suspiciousPatterns.some(pattern => pattern.test(text));
    }

    private containsScriptInjection(content: string): boolean {
        const scriptPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /vbscript:/gi,
            /on\w+\s*=/gi, // Event handlers like onclick=
            /eval\s*\(/gi,
            /document\.(write|cookie)/gi,
            /window\.(location|open)/gi
        ];

        return scriptPatterns.some(pattern => pattern.test(content));
    }

    private containsSuspiciousUrls(content: string): boolean {
        const urlPattern = /https?:\/\/[^\s<>"']+/gi;
        const urls = content.match(urlPattern) || [];

        const suspiciousDomains = [
            'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', // URL shorteners
            'localhost', '127.0.0.1', '0.0.0.0', // Local addresses
        ];

        return urls.some(url => {
            try {
                const urlObj = new URL(url);
                return suspiciousDomains.some(domain =>
                    urlObj.hostname.includes(domain)
                );
            } catch {
                return false;
            }
        });
    }

    private validateMimeSpecificContent(content: string, mimeType: string): FileValidationResult {
        switch (mimeType) {
            case 'application/json':
                try {
                    JSON.parse(content);
                    return {isValid: true};
                } catch {
                    return {
                        isValid: false,
                        error: 'Invalid JSON content'
                    };
                }

            case 'text/html':
                // Check for potentially dangerous HTML
                if (this.containsScriptInjection(content)) {
                    return {
                        isValid: false,
                        error: 'HTML content contains potentially dangerous scripts'
                    };
                }
                return {isValid: true};

            case 'text/csv':
                // Basic CSV validation
                const lines = content.split('\n');
                if (lines.length > 0) {
                    const firstLineColumns = lines[0].split(',').length;
                    const invalidLines = lines.slice(1).filter(line =>
                        line.trim() && line.split(',').length !== firstLineColumns
                    );

                    if (invalidLines.length > lines.length * 0.1) { // Allow 10% inconsistency
                        return {
                            isValid: false,
                            error: 'CSV content has inconsistent column count'
                        };
                    }
                }
                return {isValid: true};

            default:
                return {isValid: true};
        }
    }
}