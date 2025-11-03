// Security utilities for file upload validation and sanitization

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface SecurityConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  maxFilesPerUpload: number;
  scanForMalware?: boolean;
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  maxFilesPerUpload: 5,
  scanForMalware: false
};

/**
 * Validates file name to prevent path traversal and malicious file names
 */
export function validateFileName(fileName: string): FileValidationResult {
  // Check for path traversal attempts
  if (fileName.includes('../') || fileName.includes('..\\')) {
    return { isValid: false, error: 'File name contains path traversal characters' };
  }

  // Check for null bytes
  if (fileName.includes('\0')) {
    return { isValid: false, error: 'File name contains null bytes' };
  }

  // Check for reserved names (Windows)
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  const nameWithoutExt = fileName.split('.')[0].toUpperCase();
  if (reservedNames.includes(nameWithoutExt)) {
    return { isValid: false, error: 'File name is a reserved system name' };
  }

  // Check for invalid characters
  const invalidChars = /[<>:""|?*\x00-\x1f]/;
  if (invalidChars.test(fileName)) {
    return { isValid: false, error: 'File name contains invalid characters' };
  }

  // Check length
  if (fileName.length > 255) {
    return { isValid: false, error: 'File name is too long (max 255 characters)' };
  }

  // Check for hidden files (starting with .)
  if (fileName.startsWith('.')) {
    return { isValid: false, error: 'Hidden files are not allowed' };
  }

  return { isValid: true };
}

/**
 * Validates file size against security limits
 */
export function validateFileSize(file: File, maxSize: number): FileValidationResult {
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return { 
      isValid: false, 
      error: `File size exceeds maximum limit of ${maxSizeMB}MB` 
    };
  }

  if (file.size === 0) {
    return { isValid: false, error: 'File is empty' };
  }

  return { isValid: true };
}

/**
 * Validates file type using both MIME type and extension
 */
export function validateFileType(file: File, config: SecurityConfig): FileValidationResult {
  // Check MIME type
  if (!config.allowedMimeTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: `File type ${file.type} is not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}` 
    };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = config.allowedExtensions.some(ext => fileName.endsWith(ext.toLowerCase()));
  
  if (!hasValidExtension) {
    return { 
      isValid: false, 
      error: `File extension is not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}` 
    };
  }

  return { isValid: true };
}

/**
 * Basic image file header validation to prevent disguised files
 */
export function validateImageHeader(file: File): Promise<FileValidationResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Check for common image file signatures
      const signatures = {
        jpeg: [0xFF, 0xD8, 0xFF],
        png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
        gif: [0x47, 0x49, 0x46, 0x38],
        webp: [0x52, 0x49, 0x46, 0x46] // RIFF header
      };

      let isValidImage = false;
      
      // Check JPEG
      if (uint8Array.length >= 3 && 
          uint8Array[0] === signatures.jpeg[0] && 
          uint8Array[1] === signatures.jpeg[1] && 
          uint8Array[2] === signatures.jpeg[2]) {
        isValidImage = true;
      }
      
      // Check PNG
      if (uint8Array.length >= 8 && 
          signatures.png.every((byte, index) => uint8Array[index] === byte)) {
        isValidImage = true;
      }
      
      // Check GIF
      if (uint8Array.length >= 4 && 
          signatures.gif.every((byte, index) => uint8Array[index] === byte)) {
        isValidImage = true;
      }
      
      // Check WebP (simplified check for RIFF header)
      if (uint8Array.length >= 4 && 
          signatures.webp.every((byte, index) => uint8Array[index] === byte)) {
        isValidImage = true;
      }

      if (!isValidImage) {
        resolve({ isValid: false, error: 'File does not appear to be a valid image' });
      } else {
        resolve({ isValid: true });
      }
    };

    reader.onerror = () => {
      resolve({ isValid: false, error: 'Could not read file for validation' });
    };

    // Read only the first 32 bytes for header validation
    reader.readAsArrayBuffer(file.slice(0, 32));
  });
}

/**
 * Sanitizes file name for safe storage
 */
export function sanitizeFileName(fileName: string): string {
  // Remove or replace dangerous characters
  let sanitized = fileName
    .replace(/[<>:""|?*\x00-\x1f]/g, '_') // Replace invalid chars with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

  // Ensure it doesn't start with a dot
  if (sanitized.startsWith('.')) {
    sanitized = 'file_' + sanitized.substring(1);
  }

  // Ensure minimum length
  if (sanitized.length < 1) {
    sanitized = 'unnamed_file';
  }

  return sanitized;
}

/**
 * Comprehensive file validation
 */
export async function validateFile(file: File, config: SecurityConfig = DEFAULT_SECURITY_CONFIG): Promise<FileValidationResult> {
  // Validate file name
  const nameValidation = validateFileName(file.name);
  if (!nameValidation.isValid) {
    return nameValidation;
  }

  // Validate file size
  const sizeValidation = validateFileSize(file, config.maxFileSize);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  // Validate file type
  const typeValidation = validateFileType(file, config);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  // Validate image header
  const headerValidation = await validateImageHeader(file);
  if (!headerValidation.isValid) {
    return headerValidation;
  }

  return { isValid: true };
}

/**
 * Generate secure upload path
 */
export function generateSecureUploadPath(fileName: string): string {
  const timestamp = Date.now();
  const randomId = crypto.randomUUID();
  const sanitizedName = sanitizeFileName(fileName);
  
  return `images/${timestamp}-${randomId}-${sanitizedName}`;
}

/**
 * Rate limiting for uploads (simple client-side implementation)
 */
export class UploadRateLimiter {
  private uploads: number[] = [];
  private readonly maxUploads: number;
  private readonly timeWindow: number; // in milliseconds

  constructor(maxUploads: number = 10, timeWindowMinutes: number = 1) {
    this.maxUploads = maxUploads;
    this.timeWindow = timeWindowMinutes * 60 * 1000;
  }

  canUpload(): boolean {
    const now = Date.now();
    
    // Remove old uploads outside the time window
    this.uploads = this.uploads.filter(timestamp => now - timestamp < this.timeWindow);
    
    return this.uploads.length < this.maxUploads;
  }

  recordUpload(): void {
    this.uploads.push(Date.now());
  }

  getRemainingUploads(): number {
    const now = Date.now();
    this.uploads = this.uploads.filter(timestamp => now - timestamp < this.timeWindow);
    return Math.max(0, this.maxUploads - this.uploads.length);
  }
}