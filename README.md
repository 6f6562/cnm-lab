# BÁO CÁO LAB 06

## 1. Mục tiêu

- Xây dựng ứng dụng web quản lý sản phẩm bằng Node.js + Express + EJS theo mô hình MVC.
- Lưu dữ liệu sản phẩm vào DynamoDB Local (Docker).
- Hỗ trợ CRUD: xem danh sách, thêm, sửa, xóa, xem chi tiết sản phẩm.
- Hỗ trợ upload ảnh cho thêm/sửa; lưu ảnh vào local hoặc S3 theo cấu hình `.env`.
- Giao diện dùng EJS + daisyUI (CDN).

## 2. Công nghệ sử dụng

- Node.js, Express, EJS
- DynamoDB: AWS SDK v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`)
- S3: AWS SDK v3 (`@aws-sdk/client-s3`)
- Upload ảnh: `multer`
- DaisyUI qua CDN
- Docker Compose chạy DynamoDB Local

## 3. Hướng dẫn setup & chạy chương trình (Local)

### 3.1. Khởi động DynamoDB Local

1. Mục tiêu là DynamoDB Local phải chạy trên port `8000`.
2. Chạy Docker Compose:
   ```powershell
   docker compose up -d
   ```
3. Kiểm tra DynamoDB Local đã chạy (có thể xem log docker).

### 3.2. Cấu hình file `.env`

Mở file `.env` ở thư mục gốc dự án và đảm bảo các biến sau hợp lệ:

- `DYNAMODB_LOCAL=true`
- `DYNAMODB_ENDPOINT=http://localhost:8000`
- `DYNAMODB_TABLE_PRODUCTS=Products`
- `IMAGE_STORAGE_PROVIDER=local` (hoặc `s3`)
- `LOCAL_UPLOAD_DIR=uploads`
- Nếu dùng S3 (`IMAGE_STORAGE_PROVIDER=s3`) thì cần:
  - `AWS_S3_BUCKET=...`
  - (và các AWS credential)

### 3.3. Cài đặt và chạy server Express

```powershell
npm install
npm start
```

Sau đó mở trên trình duyệt:

- `http://localhost:3000/`

## 4. Mô hình dữ liệu Products

Bảng `Products` trong DynamoDB gồm các thuộc tính:

- `id`: String (Khóa chính)
- `name`: String
- `price`: Number
- `unit_in_stock`: Integer
- `url_image`: String (đường dẫn ảnh)

## 5. Chức năng

### 5.1. Xem danh sách + tìm kiếm sản phẩm (Trang home)

- Route: `GET /`
- Hiển thị danh sách sản phẩm dưới dạng table EJS.
- Tìm kiếm:
  - Theo tên: query param `q`
  - Theo giá từ min đến max:
    - `min_price`
    - `max_price`

### 5.2. Thêm sản phẩm

- `GET /products/new`: mở trang form thêm
- `POST /products`: tạo sản phẩm mới
- Upload ảnh:
  - `multer` lưu file theo cấu hình `IMAGE_STORAGE_PROVIDER`
  - Lưu đường dẫn ảnh vào `url_image` trong DynamoDB
- Thông báo lỗi/thành công hiển thị bằng alert daisyUI.

### 5.3. Sửa sản phẩm

- `GET /products/:id/edit`: mở form sửa
- `POST /products/:id`: cập nhật dữ liệu
- Upload ảnh:
  - Được cấu hình để lưu ảnh theo local hoặc S3
  - Nếu cập nhật thành công, ứng dụng sẽ xóa ảnh cũ (best-effort).

### 5.4. Xóa sản phẩm

- `POST /products/:id/delete`
- Quy trình:
  - Xóa item từ DynamoDB
  - Xóa ảnh cũ từ storage (local/S3) sau khi DynamoDB xóa (để hạn chế trường hợp xóa ảnh nhưng DynamoDB thất bại).

### 5.5. Xem chi tiết sản phẩm

- `GET /products/:id`
- Hiển thị thông tin chi tiết sản phẩm: id, name, price, unit_in_stock, ảnh.

## 6. Tổ chức code (MVC)

- `controllers/productsController.js`: xử lý handler cho CRUD và validate dữ liệu đầu vào
- `routes/products.js`: định nghĩa các route CRUD
- `services/productRepository.js`: thao tác DynamoDB (scan/get/put/delete + filter search)
- `services/imageStorageLocal.js`: lưu ảnh local (diskStorage) + xóa ảnh
- `services/imageStorageS3.js`: lưu ảnh S3 + xóa ảnh
- `app.js`: mount router, cấu hình static cho `uploads`, và khởi tạo table DynamoDB khi server start

## 7. Ghi chú về chạy từ AWS

- Khi đổi `.env`:
  - `DYNAMODB_LOCAL=false`
  - `IMAGE_STORAGE_PROVIDER=s3`
- Server sẽ tự động dùng cấu hình AWS và S3 (nếu AWS credentials và bucket được cung cấp).

## 8. Kết luận

- Ứng dụng thực hiện đầy đủ CRUD sản phẩm với DynamoDB.
- Có hỗ trợ upload ảnh và xóa ảnh cũ khi cập nhật/xóa sản phẩm.
- Tìm kiếm có thể lọc theo name và giá min/max.
