// Upload service để tương tác với AWS API Gateway và S3
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://8i4yru0v8j.execute-api.ap-southeast-1.amazonaws.com';

export interface UploadUrlResponse {
  upload_url: string;
  s3_key: string;
  message: string;
}

export interface GetUploadUrlRequest {
  fileName: string;
  fileType: string;
}

/**
 * Bước 1: Lấy presigned URL từ API Gateway
 */
export async function getUploadUrl(fileName: string, fileType: string): Promise<UploadUrlResponse> {
  try {
    console.log('Getting upload URL for:', fileName, fileType);
    
    const response = await fetch(`${API_BASE_URL}/upload-url`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        fileType,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`Failed to get upload URL: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Upload URL received:', data);
    return data;
  } catch (error) {
    console.error('Error getting upload URL:', error);
    throw error;
  }
}

/**
 * Bước 2: Upload file lên S3 sử dụng presigned URL
 */
export async function uploadFileToS3(uploadUrl: string, file: File): Promise<void> {
  try {
    console.log('Uploading file to S3:', file.name, file.type, file.size);
    
    // Upload file lên S3 với presigned URL
    // Không cần thêm headers ngoài Content-Type vì presigned URL đã có auth
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('S3 Upload Error:', response.status, errorText);
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    console.log('File uploaded successfully to S3');
    return;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

/**
 * Hàm tổng hợp: Lấy URL và upload file
 */
export async function uploadFile(file: File): Promise<{ s3_key: string }> {
  try {
    // Bước 1: Lấy presigned URL
    const { upload_url, s3_key } = await getUploadUrl(file.name, file.type);

    // Bước 2: Upload file lên S3
    await uploadFileToS3(upload_url, file);

    return { s3_key };
  } catch (error) {
    console.error('Error in upload process:', error);
    throw error;
  }
}
