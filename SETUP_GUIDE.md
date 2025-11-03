# Hướng dẫn cài đặt và sử dụng AWS S3 Image Uploader

## 📋 Mục lục
1. [Cài đặt ban đầu](#cài-đặt-ban-đầu)
2. [Cấu hình AWS](#cấu-hình-aws)
3. [Deploy application](#deploy-application)
4. [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
5. [Tùy chỉnh](#tùy-chỉnh)
6. [Troubleshooting](#troubleshooting)

## 🚀 Cài đặt ban đầu

### Bước 1: Chuẩn bị môi trường

Đảm bảo bạn đã cài đặt:
- Node.js >= 18.0.0
- npm >= 8.0.0  
- Git
- AWS CLI (khuyến nghị)

### Bước 2: Clone project

```bash
git clone <repository-url>
cd aws-s3-image-uploader
npm install
```

### Bước 3: Cài đặt Amplify CLI

```bash
npm install -g @aws-amplify/cli
```

## ☁️ Cấu hình AWS

### Bước 1: Cấu hình AWS credentials

```bash
amplify configure
```

Làm theo hướng dẫn để:
1. Đăng nhập AWS Console
2. Tạo IAM user với quyền phù hợp
3. Cấu hình Access Key ID và Secret Access Key

### Bước 2: Khởi tạo Amplify project

```bash
amplify init
```

Chọn các tùy chọn:
- Project name: `s3-image-uploader`
- Environment: `dev`
- Default editor: `Visual Studio Code`
- App type: `javascript`
- Framework: `react`
- Source directory: `src`
- Distribution directory: `dist`
- Build command: `npm run build`
- Start command: `npm run dev`

### Bước 3: Add Storage (S3)

```bash
amplify add storage
```

Cấu hình:
- Select from one of the below mentioned services: `Content (Images, audio, video, etc.)`
- Provide a friendly name: `imageStorage`
- Provide bucket name: `<unique-bucket-name>`
- Who should have access: `Auth and guest users`
- What kind of access do you want for Authenticated users: `create/update, read, delete`
- What kind of access do you want for Guest users: `create/update, read`

## 🚀 Deploy application

### Bước 1: Deploy backend

```bash
amplify push
```

Xác nhận các thay đổi và đợi deployment hoàn thành.

### Bước 2: Chạy development server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

### Bước 3: Deploy frontend (tùy chọn)

```bash
amplify add hosting
```

Chọn:
- Select the plugin module: `Hosting with Amplify Console`
- Choose a type: `Manual deployment`

Sau đó:
```bash
amplify publish
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

- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **GIF** (.gif)
- **WebP** (.webp)

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