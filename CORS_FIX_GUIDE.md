# CORS Configuration Guide

## Vấn đề CORS

Nếu bạn gặp lỗi CORS khi upload file, có thể là do:

1. **API Gateway chưa cấu hình CORS đúng**
2. **S3 Bucket chưa có CORS policy**

## 🔧 Cách khắc phục

### 1. Cấu hình CORS cho API Gateway

Truy cập AWS Console → API Gateway → Chọn API của bạn → CORS

Thêm các headers sau:

```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Accept,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
}
```

**Hoặc cấu hình trong Lambda Response:**

```python
# Python Lambda
def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        'body': json.dumps(response_data)
    }
```

```javascript
// Node.js Lambda
exports.handler = async (event) => {
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify(responseData)
    };
};
```

### 2. Cấu hình CORS cho S3 Bucket

Truy cập AWS Console → S3 → Chọn bucket → Permissions → CORS

Thêm CORS configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "HEAD"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

**Hoặc dùng AWS CLI:**

```bash
aws s3api put-bucket-cors \
  --bucket qdbn-docs-hieu-2025 \
  --cors-configuration file://cors-config.json
```

**File `cors-config.json`:**

```json
{
    "CORSRules": [
        {
            "AllowedOrigins": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
            "AllowedHeaders": ["*"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3000
        }
    ]
}
```

### 3. Kiểm tra Presigned URL

Đảm bảo presigned URL được tạo với CORS headers:

```python
# Python (boto3)
s3_client.generate_presigned_url(
    'put_object',
    Params={
        'Bucket': bucket_name,
        'Key': file_key,
        'ContentType': file_type
    },
    ExpiresIn=900,  # 15 minutes
    HttpMethod='PUT'
)
```

```javascript
// Node.js (AWS SDK v3)
const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    ContentType: fileType,
});

const uploadUrl = await getSignedUrl(s3Client, command, { 
    expiresIn: 900 
});
```

### 4. Test CORS Configuration

**Test API Gateway:**

```bash
curl -X OPTIONS https://8i4yru0v8j.execute-api.ap-southeast-1.amazonaws.com/upload-url \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Kiểm tra response có chứa:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, OPTIONS`

**Test S3 CORS:**

```bash
curl -X OPTIONS https://qdbn-docs-hieu-2025.s3.amazonaws.com/test.pdf \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: PUT" \
  -v
```

### 5. Debug trong Browser

Mở **Developer Tools → Console** và kiểm tra:

```javascript
// Test API Gateway
fetch('https://8i4yru0v8j.execute-api.ap-southeast-1.amazonaws.com/upload-url', {
  method: 'POST',
  mode: 'cors',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fileName: 'test.pdf',
    fileType: 'application/pdf'
  })
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('CORS Error:', err));
```

## 🔍 Troubleshooting

### Error: "has been blocked by CORS policy"

**Nguyên nhân**: Server không trả về CORS headers

**Giải pháp**:
1. Check API Gateway CORS settings
2. Check Lambda response headers
3. Deploy lại API sau khi thay đổi

### Error: "No 'Access-Control-Allow-Origin' header"

**Nguyên nhân**: S3 bucket chưa có CORS policy

**Giải pháp**:
1. Thêm CORS configuration vào S3 bucket
2. Đảm bảo `AllowedOrigins` có `*` hoặc domain của bạn

### Error: "Method PUT is not allowed by Access-Control-Allow-Methods"

**Nguyên nhân**: CORS policy không cho phép PUT method

**Giải pháp**:
1. Thêm `PUT` vào `AllowedMethods` trong S3 CORS
2. Kiểm tra presigned URL có đúng method không

### Error: "Preflight response status code is not successful"

**Nguyên nhân**: OPTIONS request bị lỗi

**Giải pháp**:
1. Enable OPTIONS method trong API Gateway
2. Lambda phải xử lý OPTIONS request:

```javascript
if (event.httpMethod === 'OPTIONS') {
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: ''
    };
}
```

## ✅ Checklist

- [ ] API Gateway có CORS enabled
- [ ] Lambda trả về đúng CORS headers
- [ ] S3 bucket có CORS policy
- [ ] Presigned URL được tạo đúng
- [ ] OPTIONS request được xử lý
- [ ] Deploy lại API sau khi config
- [ ] Test từ browser console
- [ ] Kiểm tra Network tab trong DevTools

## 📞 Liên hệ Backend Team

Nếu vẫn gặp CORS error, cung cấp thông tin sau cho backend team:

1. **Error message** từ browser console
2. **Network tab** screenshot (Request/Response headers)
3. **API endpoint** đang gọi
4. **Origin domain** (localhost:5173, production URL, etc.)
5. **Thời gian** xảy ra lỗi

## 🔗 Tài liệu tham khảo

- [AWS API Gateway CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)
- [S3 CORS Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)
- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
