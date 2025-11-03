# Hướng dẫn cài đặt và sử dụng AWS S3 File Upload Widget

## 📋 Mục lục
1. [Cài đặt ban đầu](#cài-đặt-ban-đầu)
2. [Cấu hình API](#cấu-hình-api)
3. [Chạy application](#chạy-application)
4. [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
5. [Tùy chỉnh](#tùy-chỉnh)
6. [Troubleshooting](#troubleshooting)

## 🚀 Cài đặt ban đầu

### Bước 1: Chuẩn bị môi trường

Đảm bảo bạn đã cài đặt:
- Node.js >= 18.0.0
- npm >= 8.0.0  
- Git

### Bước 2: Clone project

```bash
git clone <repository-url>
cd aws-s3-file-uploader
npm install
```

## ☁️ Cấu hình API

### API Endpoint

Application sử dụng AWS API Gateway để lấy presigned URL và upload file lên S3.

**API Base URL**: `https://8i4yru0v8j.execute-api.ap-southeast-1.amazonaws.com`

### Quy trình upload (2 bước)

#### Bước 1: Lấy presigned URL

```bash
POST https://8i4yru0v8j.execute-api.ap-southeast-1.amazonaws.com/upload-url

Content-Type: application/json

{
  "fileName": "example.pdf",
  "fileType": "application/pdf"
}
```

**Response:**
```json
{
  "upload_url": "https://qdbn-docs-hieu-2025.s3.amazonaws.com/example.pdf?AWSAccessKeyId=...",
  "s3_key": "example.pdf",
  "message": "Sử dụng URL này với HTTP PUT để upload file."
}
```

#### Bước 2: Upload file lên S3

```bash
PUT https://qdbn-docs-hieu-2025.s3.amazonaws.com/example.pdf?AWSAccessKeyId=...

Content-Type: application/pdf
Body: [binary file data]
```

**Response**: `200 OK`

### Cấu hình trong code

Nếu cần thay đổi API endpoint, mở file `src/services/uploadService.ts`:

```typescript
const API_BASE_URL = 'https://your-api-gateway-url.amazonaws.com';
```

## 🚀 Chạy application

### Chạy development server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

### Build production

```bash
npm run build
```

Output sẽ được tạo trong thư mục `dist/`

### Preview production build

```bash
npm run preview
```

## 🎯 Hướng dẫn sử dụng

### Giao diện chính

1. **Header Section**: Hiển thị tiêu đề và các tính năng chính
2. **Upload Area**: Vùng drag & drop hoặc click để chọn file
3. **Progress Tracking**: Hiển thị tiến trình upload
4. **File Management**: Danh sách file đã upload
5. **Statistics**: Thống kê upload

### Upload ảnh

#### Phương pháp 1: Drag & Drop
1. Kéo ảnh từ file explorer
2. Thả vào vùng upload
3. Ảnh sẽ được validate và upload tự động

#### Phương pháp 2: Click to select
1. Click vào vùng upload
2. Chọn file từ dialog
3. File sẽ được upload ngay lập tức

### Các định dạng hỗ trợ

#### Hình ảnh
- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **GIF** (.gif)
- **WebP** (.webp)

#### Tài liệu
- **PDF** (.pdf)
- **Word Document** (.docx)

### Giới hạn upload

- **Kích thước tối đa**: 10MB per file
- **Số lượng**: 10 files per minute
- **Concurrent uploads**: 5 files đồng thời

## 🎨 Tùy chỉnh

### Thay đổi giới hạn file size

Trong `src/App.tsx`:

```typescript
<ImageUploader 
  maxFileSize={20 * 1024 * 1024} // 20MB
  // ... other props
/>
```

### Thêm định dạng file mới

Trong `src/App.tsx`:

```typescript
<ImageUploader 
  allowedTypes={[
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'image/bmp'  // Thêm BMP
  ]}
  // ... other props
/>
```

### Tùy chỉnh security config

Trong `src/utils/security.ts`, chỉnh sửa `DEFAULT_SECURITY_CONFIG`:

```typescript
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxFileSize: 20 * 1024 * 1024, // 20MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  maxFilesPerUpload: 10, // Tăng lên 10 files
  scanForMalware: false
};
```

### Thay đổi theme màu

Chỉnh sửa `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#f0f9ff',
        500: '#10b981', // Đổi sang green
        600: '#059669',
        700: '#047857',
      }
    }
  }
}
```

## 🔧 Troubleshooting

### Lỗi thường gặp

#### 1. CORS Error khi upload

**Nguyên nhân**: S3 bucket chưa cấu hình CORS đúng

**Giải pháp**:
```bash
amplify update storage
```
Cấu hình lại CORS settings.

#### 2. "Access Denied" error

**Nguyên nhân**: IAM permissions không đủ

**Giải pháp**:
1. Kiểm tra IAM role trong AWS Console
2. Đảm bảo có quyền `s3:PutObject`, `s3:GetObject`
3. Chạy `amplify push` để update permissions

#### 3. File validation fails

**Nguyên nhân**: File không đúng định dạng hoặc quá lớn

**Giải pháp**:
1. Kiểm tra file type và size
2. Xem console log để biết chi tiết lỗi
3. Đảm bảo file là ảnh hợp lệ

#### 4. Rate limiting triggered

**Nguyên nhân**: Upload quá nhiều file trong thời gian ngắn

**Giải pháp**:
1. Đợi 1 phút trước khi upload tiếp
2. Giảm số lượng file upload cùng lúc
3. Tăng limit trong security config nếu cần

#### 5. Build errors

**Nguyên nhân**: Dependencies conflict hoặc thiếu

**Giải pháp**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Debug mode

Để bật debug mode, thêm vào file `.env.local`:

```
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

### Kiểm tra logs

1. **Browser Console**: Mở Developer Tools → Console
2. **AWS CloudWatch**: Xem logs từ AWS Console
3. **Amplify Console**: Kiểm tra build và deployment logs

### Performance optimization

#### 1. Lazy loading components

```typescript
const ImageUploader = lazy(() => import('./components/ImageUploader'));
```

#### 2. Image compression trước khi upload

Cài đặt và sử dụng thư viện compression:

```bash
npm install browser-image-compression
```

#### 3. Caching optimization

Thêm service worker để cache static assets.

### Monitoring và Analytics

#### 1. AWS CloudWatch

- Monitor S3 upload metrics
- Track error rates
- Set up alarms

#### 2. User analytics

Tích hợp Google Analytics hoặc AWS Pinpoint để theo dõi usage.

## 📞 Support

Nếu gặp vấn đề không giải quyết được:

1. Kiểm tra [GitHub Issues](../../issues)
2. Tạo issue mới với:
   - Mô tả chi tiết lỗi
   - Steps to reproduce
   - Screenshot (nếu có)
   - Browser và OS version
3. Tag với label phù hợp

## 📚 Tài liệu tham khảo

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/)

---

**Happy coding! 🚀**