# Ứng Dụng Quản Lý Sản Phẩm với DynamoDB Local

Ứng dụng web quản lý sản phẩm sử dụng Node.js, Express, DynamoDB Local (chạy trong Docker) và AWS S3 để lưu trữ hình ảnh.

## 📋 Mục Lục

- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Cài Đặt](#cài-đặt)
- [Cấu Hình](#cấu-hình)
- [Chạy Ứng Dụng](#chạy-ứng-dụng)
- [Truy Cập](#truy-cập)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)

---

## Yêu Cầu Hệ Thống

- ✅ **Node.js** 18+ đã được cài đặt
- ✅ **Docker Desktop** đã được cài đặt và đang chạy
- ✅ **AWS Account** (chỉ cần cho S3, không cần DynamoDB)
- ✅ **AWS Access Key ID và Secret Access Key** (cho S3)

### Kiểm Tra Cài Đặt

```bash
# Kiểm tra Node.js
node --version

# Kiểm tra npm
npm --version

# Kiểm tra Docker
docker --version

# Kiểm tra Docker Compose
docker-compose --version
```

---

## Cài Đặt

### 1. Clone Repository

```bash
git clone <repository-url>
cd lab3_22691861_NguyenGiaBao
```

### 2. Cài Đặt Dependencies

```bash
npm install
```

---

## Cấu Hình

### 1. Tạo File `.env`

Copy file mẫu và điền thông tin của bạn:

```bash
# Windows PowerShell
copy .env.local.example .env

# Linux/Mac/Git Bash
cp .env.local.example .env
```

### 2. Cập Nhật File `.env`

Mở file `.env` và cập nhật các giá trị sau:

```env
# DynamoDB Local Configuration (chạy trong Docker)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TABLE=Products

# AWS S3 Configuration (Cần credentials thật từ AWS)
AWS_ACCESS_KEY_ID_S3=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY_S3=your-aws-secret-access-key
S3_BUCKET_NAME=your-s3-bucket-name
```

**Lưu ý quan trọng**:
- `DYNAMODB_ENDPOINT` phải là `http://localhost:8000` khi chạy app local
- `AWS_ACCESS_KEY_ID` và `AWS_SECRET_ACCESS_KEY` cho DynamoDB Local có thể là bất kỳ giá trị nào (thường dùng "local")
- `AWS_ACCESS_KEY_ID_S3` và `AWS_SECRET_ACCESS_KEY_S3` phải là credentials thật từ AWS để upload hình ảnh

---

## Chạy Ứng Dụng

### Cách 1: Sử Dụng Script Tự Động (Khuyến nghị)

Script sẽ tự động:
- ✅ Kiểm tra Docker đang chạy
- ✅ Khởi động DynamoDB Local
- ✅ Tạo bảng Products nếu chưa có
- ✅ Kiểm tra file .env
- ✅ Cài đặt dependencies nếu cần
- ✅ Khởi động ứng dụng

#### Windows PowerShell

```powershell
.\scripts\start-local.ps1
```

#### Linux/Mac/Git Bash

```bash
chmod +x scripts/start-local.sh
./scripts/start-local.sh
```

### Cách 2: Chạy Thủ Công

Nếu bạn muốn kiểm soát từng bước:

#### Bước 1: Khởi Động DynamoDB Local

```bash
docker-compose up -d
```

#### Bước 2: Tạo Bảng Products

```bash
npm run create-table
```

#### Bước 3: Chạy Ứng Dụng

```bash
npm start
```

---

## Truy Cập

Sau khi ứng dụng đã khởi động, bạn có thể truy cập:

- **Ứng dụng Web**: http://localhost:3000
- **DynamoDB Admin GUI**: http://localhost:8001
- **DynamoDB Local API**: http://localhost:8000

---

## Scripts

### NPM Scripts

```bash
# Chạy ứng dụng
npm start

# Tạo bảng Products trong DynamoDB Local
npm run create-table
```

### Script Files

#### `scripts/start-local.ps1` (Windows)
Script tự động khởi động ứng dụng cho Windows PowerShell.

#### `scripts/start-local.sh` (Linux/Mac)
Script tự động khởi động ứng dụng cho Linux/Mac/Git Bash.

#### `scripts/create-table.js`
Script tạo bảng Products trong DynamoDB Local. Tự động kiểm tra xem bảng đã tồn tại chưa.

---

## Dừng Ứng Dụng

### Dừng App Node.js

Nhấn `Ctrl + C` trong terminal đang chạy ứng dụng.

### Dừng DynamoDB Local

```bash
docker-compose down
```

### Dừng Tất Cả và Xóa Dữ Liệu

```bash
# Dừng containers và xóa volumes
docker-compose down -v
```

---

## Troubleshooting

### Lỗi: Docker chưa chạy

**Triệu chứng**: Script báo lỗi "Docker chưa chạy"

**Giải pháp**:
1. Khởi động Docker Desktop
2. Đợi Docker khởi động hoàn toàn
3. Chạy lại script

### Lỗi: Cannot connect to DynamoDB

**Triệu chứng**: Ứng dụng không thể kết nối với DynamoDB Local

**Giải pháp**:
```bash
# Kiểm tra DynamoDB Local đang chạy
docker ps | grep dynamodb-local

# Kiểm tra port 8000
curl http://localhost:8000

# Khởi động lại DynamoDB Local
docker-compose restart dynamodb-local

# Kiểm tra file .env có DYNAMODB_ENDPOINT=http://localhost:8000
```

### Lỗi: Table not found

**Triệu chứng**: Lỗi "Table Products not found"

**Giải pháp**:
```bash
# Tạo bảng Products
npm run create-table

# Hoặc chạy script trực tiếp
node scripts/create-table.js
```

### Lỗi: AWS Access Key Id does not exist

**Triệu chứng**: Lỗi khi upload hình ảnh lên S3

**Giải pháp**:
1. Kiểm tra file `.env` có `AWS_ACCESS_KEY_ID_S3` và `AWS_SECRET_ACCESS_KEY_S3`
2. Đảm bảo credentials là hợp lệ và còn active
3. Kiểm tra IAM permissions cho S3 bucket
4. Kiểm tra bucket name đúng

### Lỗi: Port 3000 already in use

**Triệu chứng**: Không thể khởi động ứng dụng vì port 3000 đã được sử dụng

**Giải pháp**:
```bash
# Windows: Tìm process đang dùng port 3000
netstat -ano | findstr :3000

# Linux/Mac: Tìm process đang dùng port 3000
lsof -i :3000

# Dừng process hoặc đổi port trong app.js
```

### Reset DynamoDB Local

Nếu muốn xóa tất cả dữ liệu và bắt đầu lại:

```bash
# Dừng containers và xóa volumes
docker-compose down -v

# Khởi động lại
docker-compose up -d

# Tạo lại bảng
npm run create-table
```

---

## Cấu Trúc Dự Án

```
.
├── app.js                 # File chính của ứng dụng
├── package.json           # Dependencies và scripts
├── docker-compose.yml     # Cấu hình Docker cho DynamoDB Local
├── Dockerfile             # Dockerfile cho app (nếu cần)
├── .env                   # Biến môi trường (không commit)
├── .env.local.example     # File mẫu cho .env
├── scripts/               # Các script helper
│   ├── start-local.ps1    # Script khởi động cho Windows
│   ├── start-local.sh     # Script khởi động cho Linux/Mac
│   └── create-table.js    # Script tạo bảng DynamoDB
├── controllers/           # Controllers
│   └── product.controller.js
├── routes/               # Routes
│   └── product.routes.js
├── services/             # Services
│   ├── dynamodb.js       # DynamoDB client
│   └── s3.js             # S3 client
├── views/                # EJS templates
│   └── products/
└── public/               # Static files
    └── css/
```

---

## Tính Năng

- ✅ CRUD sản phẩm (Create, Read, Update, Delete)
- ✅ Upload hình ảnh lên AWS S3
- ✅ Sử dụng DynamoDB Local cho development (miễn phí)
- ✅ DynamoDB Admin GUI để quản lý dữ liệu
- ✅ Hot reload khi chạy local

---

## Lưu Ý

- File `.env` chứa thông tin nhạy cảm, không commit lên Git
- DynamoDB Local chỉ dùng cho development, không dùng cho production
- S3 vẫn cần AWS credentials thật để upload hình ảnh
- Dữ liệu DynamoDB Local được lưu trong thư mục `docker/dynamodb/`

---

## Tác Giả

**Nguyễn Gia Bảo** - 22691861

---

## License

ISC
