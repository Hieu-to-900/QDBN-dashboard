# API Documentation

## Base URL
```
https://8i4yru0v8j.execute-api.ap-southeast-1.amazonaws.com
```

## Endpoints

### 1. Get Upload URL

**Endpoint**: `POST /upload-url`

**Description**: Lấy presigned URL để upload file lên S3

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "fileName": "example.pdf",
  "fileType": "application/pdf"
}
```

**Response** (200 OK):
```json
{
  "upload_url": "https://qdbn-docs-hieu-2025.s3.amazonaws.com/example.pdf?AWSAccessKeyId=ASIASVQKIBP6PZLLTZ5D&Signature=...",
  "s3_key": "example.pdf",
  "message": "Sử dụng URL này với HTTP PUT để upload file PDF."
}
```

**Example (curl)**:
```bash
curl -X POST https://8i4yru0v8j.execute-api.ap-southeast-1.amazonaws.com/upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.pdf",
    "fileType": "application/pdf"
  }'
```

**Example (JavaScript/Fetch)**:
```javascript
const response = await fetch('https://8i4yru0v8j.execute-api.ap-southeast-1.amazonaws.com/upload-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fileName: 'test.pdf',
    fileType: 'application/pdf',
  }),
});

const data = await response.json();
console.log(data.upload_url);
```

---

### 2. Upload File to S3

**Endpoint**: `PUT {upload_url}`

**Description**: Upload file binary lên S3 sử dụng presigned URL từ bước 1

**Request Headers**:
```
Content-Type: {fileType}
```

**Request Body**: 
- Binary file data

**Response**: `200 OK` (empty body)

**Example (curl)**:
```bash
curl -X PUT "https://qdbn-docs-hieu-2025.s3.amazonaws.com/example.pdf?AWSAccessKeyId=..." \
  -H "Content-Type: application/pdf" \
  --data-binary "@/path/to/file.pdf"
```

**Example (JavaScript/Fetch)**:
```javascript
const file = document.getElementById('fileInput').files[0];

await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type,
  },
});
```

---

## Complete Upload Flow

### Step-by-step Process

```mermaid
sequenceDiagram
    participant C as Client
    participant API as API Gateway
    participant Lambda as Lambda Function
    participant S3 as S3 Bucket

    C->>API: POST /upload-url<br/>{fileName, fileType}
    API->>Lambda: Invoke Lambda
    Lambda->>Lambda: Generate presigned URL
    Lambda-->>API: Return {upload_url, s3_key}
    API-->>C: 200 OK {upload_url}
    
    C->>S3: PUT upload_url<br/>[Binary File Data]
    S3-->>C: 200 OK
    
    Note over C,S3: File uploaded successfully
```

### Code Example (TypeScript)

```typescript
// 1. Get presigned URL
async function getUploadUrl(fileName: string, fileType: string) {
  const response = await fetch('https://8i4yru0v8j.execute-api.ap-southeast-1.amazonaws.com/upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileName, fileType }),
  });
  
  return await response.json();
}

// 2. Upload file to S3
async function uploadToS3(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });
  
  if (!response.ok) {
    throw new Error('Upload failed');
  }
}

// 3. Complete upload process
async function uploadFile(file: File) {
  try {
    // Step 1: Get presigned URL
    const { upload_url, s3_key } = await getUploadUrl(file.name, file.type);
    
    // Step 2: Upload file
    await uploadToS3(upload_url, file);
    
    console.log('File uploaded successfully:', s3_key);
    return s3_key;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
```

---

## Supported File Types

### Images
- `image/jpeg` - JPEG images
- `image/png` - PNG images
- `image/gif` - GIF images
- `image/webp` - WebP images

### Documents
- `application/pdf` - PDF documents

### Others
API có thể hỗ trợ thêm các loại file khác tùy theo cấu hình backend.

---

## Error Handling

### Common Errors

#### 400 Bad Request
```json
{
  "error": "Missing required fields: fileName, fileType"
}
```

**Cause**: Request body thiếu các trường bắt buộc

**Solution**: Đảm bảo body request có đủ `fileName` và `fileType`

---

#### 403 Forbidden
```
<Error>
  <Code>AccessDenied</Code>
  <Message>Request has expired</Message>
</Error>
```

**Cause**: Presigned URL đã hết hạn (thường sau 15 phút)

**Solution**: Lấy presigned URL mới và thử lại

---

#### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

**Cause**: Lỗi xảy ra ở backend (Lambda, S3, ...)

**Solution**: 
- Kiểm tra logs trong CloudWatch
- Thử lại sau vài phút
- Liên hệ admin nếu lỗi kéo dài

---

## Rate Limiting

- **Client-side**: 10 uploads per minute (configurable)
- **Server-side**: Tùy theo cấu hình AWS API Gateway

---

## Security

### Presigned URL Security
- URL có thời hạn (thường 15 phút)
- Chỉ cho phép PUT method
- Giới hạn file type và size tại backend

### Client-side Validation
- File type validation
- File size limits (max 10MB default)
- File header verification
- Rate limiting

---

## Testing

### Test với curl

```bash
# 1. Get upload URL
RESPONSE=$(curl -X POST https://8i4yru0v8j.execute-api.ap-southeast-1.amazonaws.com/upload-url \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.pdf","fileType":"application/pdf"}')

# 2. Extract upload URL
UPLOAD_URL=$(echo $RESPONSE | jq -r '.upload_url')

# 3. Upload file
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: application/pdf" \
  --data-binary "@test.pdf"
```

### Test với Postman

1. **Request 1**: Get Upload URL
   - Method: POST
   - URL: `https://8i4yru0v8j.execute-api.ap-southeast-1.amazonaws.com/upload-url`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "fileName": "test.pdf",
       "fileType": "application/pdf"
     }
     ```
   - Copy `upload_url` from response

2. **Request 2**: Upload File
   - Method: PUT
   - URL: Paste `upload_url` từ response trước
   - Headers: `Content-Type: application/pdf`
   - Body: Binary file

---

## Monitoring

### Metrics to Monitor

- **Upload Success Rate**: % requests thành công
- **Average Upload Time**: Thời gian trung bình để upload
- **Error Rate**: % requests bị lỗi
- **File Sizes**: Phân bố kích thước file

### Logs

- **CloudWatch Logs**: Xem Lambda execution logs
- **S3 Access Logs**: Track file access patterns
- **API Gateway Logs**: Monitor API calls

---

## Support

Nếu gặp vấn đề với API:
1. Kiểm tra error response
2. Xem browser console logs
3. Contact backend team với thông tin:
   - Request timestamp
   - Error message
   - File details (name, size, type)
