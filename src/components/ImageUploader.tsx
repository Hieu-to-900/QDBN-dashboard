import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadData } from 'aws-amplify/storage';
import { 
  validateFile, 
  generateSecureUploadPath, 
  UploadRateLimiter,
  DEFAULT_SECURITY_CONFIG
} from '../utils/security';

interface UploadedImage {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: Date;
  status: 'uploading' | 'success' | 'error';
}

interface ImageUploaderProps {
  onUploadComplete?: (image: UploadedImage) => void;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadComplete,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
}) => {
  const [rateLimiter] = useState(() => new UploadRateLimiter(10, 1)); // 10 uploads per minute

  const uploadToS3 = async (file: File): Promise<UploadedImage> => {
    const fileId = crypto.randomUUID();
    const securePath = generateSecureUploadPath(file.name);

    try {
      const result = await uploadData({
        key: securePath,
        data: file,
        options: {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadedBy: 'anonymous',
            uploadedAt: new Date().toISOString(),
            fileSize: file.size.toString(),
            securityValidated: 'true'
          }
        }
      }).result;

      rateLimiter.recordUpload();

      const uploadedImage = {
        id: fileId,
        name: file.name,
        url: result.key,
        size: file.size,
        uploadedAt: new Date(),
        status: 'success' as const
      };
      onUploadComplete?.(uploadedImage);
      return uploadedImage;
    } catch (error) {
      console.error('Upload failed:', error);
      const failedImage = {
        id: fileId,
        name: file.name,
        url: '',
        size: file.size,
        uploadedAt: new Date(),
        status: 'error' as const
      };
      onUploadComplete?.(failedImage);
      throw new Error('Upload failed');
    }
  };

  const handleFileDrop = async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if (!rateLimiter.canUpload()) {
        alert(`Upload rate limit exceeded. Please try again in a minute.`);
        continue;
      }

      const config = {
        ...DEFAULT_SECURITY_CONFIG,
        maxFileSize,
        allowedMimeTypes: allowedTypes,
        allowedExtensions: allowedTypes.map(type => `.${type.split('/')[1]}`)
      };
  
      const validation = await validateFile(file, config);

      if (!validation.isValid) {
        alert(`File validation failed for ${file.name}: ${validation.error}`);
        continue;
      }

      try {
        // Inform App component that upload is starting
        onUploadComplete?.({
          id: crypto.randomUUID(),
          name: file.name,
          url: '',
          size: file.size,
          uploadedAt: new Date(),
          status: 'uploading',
        });
        await uploadToS3(file);
      } catch (error) {
        // Error is handled inside uploadToS3
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleFileDrop,
    accept: {
      'image/*': allowedTypes.map(type => `.${type.split('/')[1]}`)
    },
    maxSize: maxFileSize,
    multiple: true,
    noClick: true, // We'll trigger the file dialog manually
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button 
          type="button"
          onClick={open}
          style={{
            backgroundColor: '#06b6d4',
            color: 'white',
            fontWeight: '400',
            padding: '0.625rem 4rem',
            fontSize: '0.875rem',
            cursor: 'pointer',
            border: 'none',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0891b2'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#06b6d4'}
        >
          Choose file.
        </button>
      </div>
      
      <div style={{ textAlign: 'center', fontWeight: '600', fontSize: '0.875rem', color: '#4b5563' }}>
        OR
      </div>
      
      <div
        {...getRootProps()}
        style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          border: '2px dashed #fbbf24',
          backgroundColor: isDragActive ? '#fef3c7' : 'white'
        }}
      >
        <input {...getInputProps()} />
        <p style={{ fontWeight: '400', fontSize: '1rem', color: '#eab308' }}>
          drag and drop files here
        </p>
      </div>
    </div>
  );
};

export default ImageUploader;