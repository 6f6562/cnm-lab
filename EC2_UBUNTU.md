# Hướng Dẫn Triển Khai Ứng Dụng Node.js lên AWS EC2

Tài liệu này sẽ hướng dẫn bạn từng bước để đưa ứng dụng quản lý sản phẩm lên máy chủ ảo EC2 của AWS.

## 📋 Mục Lục

1. [Chuẩn bị trước khi deploy](#chuẩn-bị-trước-khi-deploy)
2. [Giai Đoạn 1: Khởi tạo EC2 Instance](#giai-đoạn-1-khởi-tạo-ec2-instance-trên-aws-console)
3. [Giai Đoạn 2: Kết nối vào Server](#giai-đoạn-2-kết-nối-vào-server)
4. [Giai Đoạn 3: Cài đặt Môi trường](#giai-đoạn-3-cài-đặt-môi-trường-trên-server-ec2)
5. [Giai Đoạn 4: Đưa Code lên Server](#giai-đoạn-4-đưa-code-lên-server)
6. [Giai Đoạn 5: Cấu hình Biến Môi Trường](#giai-đoạn-5-cấu-hình-biến-môi-trường-env)
7. [Giai Đoạn 6: Chạy Ứng dụng](#giai-đoạn-6-chạy-ứng-dụng)
8. [Giai Đoạn 7: Chạy trên Port 80 (Tùy chọn)](#giai-đoạn-7-nâng-cao-chạy-trên-port-80-tùy-chọn)
9. [Troubleshooting](#troubleshooting)
10. [Kiểm tra và Bảo mật](#kiểm-tra-và-bảo-mật)

---

## Chuẩn bị trước khi deploy

### Yêu cầu:
- ✅ Tài khoản AWS đã được kích hoạt
- ✅ Đã có AWS Access Key ID và Secret Access Key
- ✅ Đã tạo DynamoDB Table (tên: `Products`)
- ✅ Đã tạo S3 Bucket để lưu trữ hình ảnh
- ✅ Code đã được test trên local và hoạt động tốt
- ✅ Đã có Git repository (GitHub/GitLab) hoặc sẵn sàng upload code

### Kiểm tra file `.env` local:
Đảm bảo file `.env` của bạn có đầy đủ các biến sau:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
S3_BUCKET_NAME=your-bucket-name
DYNAMODB_TABLE=Products
```

---

## Giai Đoạn 1: Khởi tạo EC2 Instance (Trên AWS Console)

### Bước 1: Đăng nhập AWS Console
1. Truy cập [AWS Console](https://console.aws.amazon.com/)
2. Đăng nhập với tài khoản AWS của bạn
3. Tìm và chọn dịch vụ **EC2** từ menu dịch vụ

### Bước 2: Launch Instance
1. Nhấn nút **Launch Instance** (Màu cam) ở góc trên bên phải
2. Hoặc chọn **Instances** từ menu bên trái, sau đó nhấn **Launch Instance**

### Bước 3: Cấu hình Instance
1. **Name và tags**: 
   - Đặt tên: `NodeJS-Product-App` (hoặc tên bạn muốn)

2. **Application and OS Images (Amazon Machine Image - AMI)**:
   - Chọn **Ubuntu** 
   - Khuyến nghị: **Ubuntu Server 22.04 LTS** hoặc **24.04 LTS**
   - Đảm bảo chọn phiên bản **Free tier eligible**

3. **Instance type**:
   - Chọn `t2.micro` (Free tier eligible)
   - Đủ cho ứng dụng nhỏ đến trung bình

4. **Key pair (login)**:
   - Nhấn **Create new key pair**
   - **Key pair name**: Đặt tên (vd: `ec2-product-app-key`)
   - **Key pair type**: Chọn `RSA`
   - **Private key file format**: 
     - Chọn `.pem` nếu dùng SSH trên Mac/Linux/Windows 10+
     - Chọn `.ppk` nếu dùng PuTTY trên Windows cũ
   - Nhấn **Create key pair**
   - ⚠️ **QUAN TRỌNG**: File `.pem` sẽ tự động tải về. Lưu file này ở nơi an toàn và không được làm mất!

5. **Network settings**:
   - **VPC**: Giữ mặc định
   - **Subnet**: Giữ mặc định
   - **Auto-assign Public IP**: Chọn **Enable**
   - **Firewall (security groups)**:
     - Chọn **Create security group**
     - **Security group name**: `product-app-sg`
     - **Description**: `Security group for Product Management App`
     
     **Thêm các rules sau:**
     - **SSH (Port 22)**:
       - Type: `SSH`
       - Port: `22`
       - Source type: `My IP` (khuyến nghị để bảo mật) hoặc `Anywhere-IPv4` (0.0.0.0/0) nếu IP thay đổi
     
     - **HTTP (Port 80)**:
       - Type: `HTTP`
       - Port: `80`
       - Source: `Anywhere-IPv4` (0.0.0.0/0)
     
     - **Custom TCP (Port 3000)**:
       - Nhấn **Add security group rule**
       - Type: `Custom TCP`
       - Port range: `3000`
       - Source: `Anywhere-IPv4` (0.0.0.0/0)
       - Description: `Node.js app port`

6. **Configure storage**:
   - Giữ mặc định 8 GB gp3 (Free tier)
   - Hoặc tăng lên nếu cần

7. **Advanced details** (Tùy chọn):
   - Có thể bỏ qua cho lần đầu

### Bước 4: Launch
1. Xem lại cấu hình ở phần **Summary** bên phải
2. Nhấn **Launch instance**
3. Chờ vài giây để instance khởi động
4. Nhấn **View all instances** để xem instance của bạn

### Bước 5: Lấy Public IP
1. Trong danh sách instances, tìm instance vừa tạo
2. Chờ đến khi **Instance state** chuyển sang **Running** (có thể mất 1-2 phút)
3. Copy **Public IPv4 address** (ví dụ: `54.123.45.67`)
4. Lưu lại IP này để dùng cho SSH và truy cập web

## Giai Đoạn 2: Kết nối vào Server

### Trên Windows (PowerShell hoặc CMD):

1. **Mở PowerShell hoặc CMD** với quyền Administrator (nếu cần)

2. **Di chuyển đến thư mục chứa file `.pem`**:
   ```powershell
   cd C:\path\to\your\key\folder
   ```

3. **Thiết lập quyền cho file key** (chỉ cần làm 1 lần):
   ```powershell
   icacls "ten-file-key.pem" /inheritance:r
   icacls "ten-file-key.pem" /grant:r "%username%:R"
   ```

4. **Kết nối SSH**:
   ```bash
   ssh -i "ten-file-key.pem" ubuntu@<PUBLIC-IP-CUA-EC2>
   ```
   Thay:
   - `ten-file-key.pem` bằng tên file key của bạn
   - `<PUBLIC-IP-CUA-EC2>` bằng Public IP bạn đã copy (vd: `54.123.45.67`)

5. **Lần đầu kết nối**, bạn sẽ thấy cảnh báo về host authenticity. Gõ `yes` và nhấn Enter.

6. **Nếu thành công**, bạn sẽ thấy prompt như:
   ```
   ubuntu@ip-xxx-xxx-xxx-xxx:~$
   ```

### Trên Mac/Linux:

1. **Mở Terminal**

2. **Di chuyển đến thư mục chứa file `.pem`**:
   ```bash
   cd /path/to/your/key/folder
   ```

3. **Thiết lập quyền cho file key** (chỉ cần làm 1 lần):
   ```bash
   chmod 400 ten-file-key.pem
   ```

4. **Kết nối SSH**:
   ```bash
   ssh -i "ten-file-key.pem" ubuntu@<PUBLIC-IP-CUA-EC2>
   ```

### Lưu ý:
- **Username**: Luôn là `ubuntu` cho Ubuntu AMI
- **Nếu IP thay đổi**: Mỗi lần restart instance, Public IP có thể thay đổi (trừ khi bạn dùng Elastic IP)
- **Troubleshooting SSH**: Xem phần [Troubleshooting](#troubleshooting) bên dưới

## Giai Đoạn 3: Cài đặt Môi trường (Trên Server EC2)

Sau khi SSH thành công, bạn sẽ thấy terminal của EC2 instance. Chạy các lệnh sau:

### Bước 1: Cập nhật hệ thống
```bash
sudo apt update
sudo apt upgrade -y
```
Chờ quá trình cập nhật hoàn tất (có thể mất vài phút).

### Bước 2: Cài đặt Node.js (Phiên bản LTS 22.x)
```bash
# Tải và chạy script cài đặt NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Cài đặt Node.js và npm
sudo apt-get install -y nodejs
```

### Bước 3: Kiểm tra cài đặt
```bash
node -v
# Kết quả mong đợi: v22.x.x hoặc tương tự

npm -v
# Kết quả mong đợi: 10.x.x hoặc tương tự
```

### Bước 4: Cài đặt Git (Cần thiết để clone repository)
```bash
sudo apt install git -y
git --version
```

### Bước 5: Cài đặt các công cụ hỗ trợ (Tùy chọn nhưng khuyến nghị)
```bash
# Cài đặt build-essential (có thể cần cho một số npm packages)
sudo apt install build-essential -y

# Cài đặt PM2 (sẽ dùng sau để quản lý process)
sudo npm install -g pm2
```

### Bước 6: Kiểm tra kết nối internet
```bash
ping -c 3 google.com
```
Nếu ping thành công, bạn đã sẵn sàng để tiếp tục.

## Giai Đoạn 4: Đưa Code lên Server

### Cách 1: Dùng Git (Khuyến nghị - Dễ nhất và tốt nhất)

#### Bước 1: Chuẩn bị repository
Nếu chưa có Git repository:
1. Tạo repository trên GitHub/GitLab
2. Push code lên repository:
   ```bash
   # Trên máy local của bạn
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <YOUR_REPO_URL>
   git push -u origin main
   ```

#### Bước 2: Clone repository trên EC2
Trên EC2 instance, chạy:
```bash
# Di chuyển về thư mục home
cd ~

# Clone repository
git clone <YOUR_REPO_URL>
# Ví dụ: git clone https://github.com/yourusername/your-repo.git

# Di chuyển vào thư mục project
cd <TEN_THU_MUC_REPO>
# Ví dụ: cd EC2-Deployment-Product-main
```

#### Bước 3: Cài đặt dependencies
```bash
npm install
```
Chờ quá trình cài đặt hoàn tất (có thể mất vài phút).

### Cách 2: Upload file bằng SCP (Nếu không dùng Git)

#### Trên Windows (PowerShell):
```powershell
# Di chuyển đến thư mục project trên máy local
cd C:\path\to\your\project

# Upload toàn bộ project (trừ node_modules và .env)
scp -i "ten-file-key.pem" -r . ubuntu@<PUBLIC-IP>:/home/ubuntu/product-app
```

#### Trên Mac/Linux:
```bash
# Di chuyển đến thư mục project trên máy local
cd /path/to/your/project

# Upload toàn bộ project
scp -i "ten-file-key.pem" -r . ubuntu@<PUBLIC-IP>:/home/ubuntu/product-app
```

Sau đó trên EC2:
```bash
cd ~/product-app
npm install
```

### Cách 3: Tạo file thủ công (Không khuyến nghị)
Chỉ dùng nếu không thể dùng Git hoặc SCP. Bạn sẽ phải tạo từng file một bằng `nano` hoặc `vi`.

### Kiểm tra sau khi upload:
```bash
# Kiểm tra các file đã có đầy đủ
ls -la

# Kiểm tra package.json
cat package.json

# Kiểm tra app.js
cat app.js
```

## Giai Đoạn 5: Cấu hình Biến Môi Trường (.env)

⚠️ **QUAN TRỌNG**: File `.env` chứa thông tin nhạy cảm. Đảm bảo không commit file này lên Git.

### Bước 1: Tạo file .env
Trong thư mục project trên EC2:
```bash
nano .env
```

### Bước 2: Nhập nội dung
Copy và paste nội dung sau, **thay thế các giá trị** bằng thông tin thực của bạn:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-actual-access-key-id
AWS_SECRET_ACCESS_KEY=your-actual-secret-access-key
S3_BUCKET_NAME=your-actual-bucket-name
DYNAMODB_TABLE=Products
```

**Lưu ý:**
- `AWS_REGION`: Region nơi bạn tạo DynamoDB và S3 (vd: `us-east-1`, `ap-southeast-1`)
- `AWS_ACCESS_KEY_ID`: Access Key ID từ AWS IAM
- `AWS_SECRET_ACCESS_KEY`: Secret Access Key từ AWS IAM
- `S3_BUCKET_NAME`: Tên bucket S3 bạn đã tạo (không có `https://` hoặc `.s3.amazonaws.com`)
- `DYNAMODB_TABLE`: Tên table DynamoDB (thường là `Products`)

### Bước 3: Lưu file
1. Nhấn `Ctrl + O` để lưu
2. Nhấn `Enter` để xác nhận
3. Nhấn `Ctrl + X` để thoát

### Bước 4: Kiểm tra file đã được tạo
```bash
cat .env
```
Đảm bảo không có lỗi và các giá trị đã được điền đúng.

### Bước 5: Bảo mật file .env
```bash
# Chỉ cho phép owner đọc file
chmod 600 .env

# Kiểm tra quyền
ls -la .env
# Kết quả mong đợi: -rw------- (chỉ owner có quyền đọc/ghi)
```

### Lưu ý về AWS Credentials:
- **Không bao giờ** commit file `.env` lên Git
- Đảm bảo AWS IAM user có đủ quyền:
  - DynamoDB: `AmazonDynamoDBFullAccess` hoặc custom policy
  - S3: `AmazonS3FullAccess` hoặc custom policy cho bucket cụ thể

## Giai Đoạn 6: Chạy Ứng dụng

### Bước 1: Test ứng dụng (Chạy thử nghiệm)

Trong thư mục project:
```bash
node app.js
```

Bạn sẽ thấy output:
```
Server running at http://localhost:3000
```

**Giữ terminal này mở** và mở trình duyệt trên máy local, truy cập:
```
http://<PUBLIC-IP>:3000
```
Thay `<PUBLIC-IP>` bằng Public IP của EC2 instance.

**Nếu web hiện lên thành công:**
- ✅ Ứng dụng đã hoạt động!
- ✅ Nhấn `Ctrl + C` trong terminal để dừng server

**Nếu không truy cập được:**
- Kiểm tra Security Group đã mở port 3000 chưa
- Kiểm tra file `.env` có đúng không
- Xem phần [Troubleshooting](#troubleshooting)

### Bước 2: Chạy Production với PM2 (Giữ app luôn chạy)

PM2 giúp quản lý Node.js process, tự động restart khi crash, và chạy ngầm.

#### 2.1. Khởi động app với PM2
```bash
pm2 start app.js --name "product-app"
```

Output mong đợi:
```
[PM2] Starting app.js...
[PM2] App [product-app] launched
```

#### 2.2. Kiểm tra trạng thái
```bash
pm2 status
```

#### 2.3. Xem logs
```bash
# Xem tất cả logs
pm2 logs product-app

# Xem logs real-time
pm2 logs product-app --lines 50

# Xem logs và theo dõi
pm2 logs product-app --follow
```

#### 2.4. Các lệnh PM2 hữu ích
```bash
# Dừng app
pm2 stop product-app

# Restart app
pm2 restart product-app

# Xóa app khỏi PM2
pm2 delete product-app

# Xem thông tin chi tiết
pm2 show product-app

# Xem monitoring
pm2 monit
```

#### 2.5. Cấu hình PM2 khởi động cùng hệ thống
```bash
# Tạo startup script
pm2 startup

# Lưu danh sách processes hiện tại
pm2 save
```

Sau khi chạy `pm2 startup`, bạn sẽ thấy một lệnh cần chạy với `sudo`. Copy và chạy lệnh đó.

#### 2.6. Kiểm tra lại
```bash
# Restart EC2 instance để test
sudo reboot

# Sau khi reboot, SSH lại và kiểm tra
pm2 status
# App sẽ tự động khởi động lại
```

### Bước 3: Truy cập ứng dụng
Mở trình duyệt và truy cập:
```
http://<PUBLIC-IP>:3000
```

Bạn sẽ thấy giao diện Product Management với DaisyUI!

## Giai Đoạn 7 (Nâng cao): Chạy trên Port 80 (Tùy chọn)

Hiện tại ứng dụng chạy trên port 3000, bạn cần truy cập `http://IP:3000`. Để truy cập chỉ với `http://IP` (port 80), có 2 cách:

### Cách 1: Dùng IPTables (Đơn giản nhưng không khuyến nghị cho production)

```bash
# Forward port 80 đến port 3000
sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000

# Lưu rules (Ubuntu)
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

**Lưu ý:** Cách này có thể mất sau khi reboot. Cần cấu hình lại.

### Cách 2: Dùng Nginx Reverse Proxy (Khuyến nghị cho production)

#### Bước 1: Cài đặt Nginx
```bash
sudo apt update
sudo apt install nginx -y
```

#### Bước 2: Cấu hình Nginx
```bash
sudo nano /etc/nginx/sites-available/product-app
```

Thêm nội dung sau:
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Lưu file: `Ctrl + O`, `Enter`, `Ctrl + X`

#### Bước 3: Kích hoạt site
```bash
# Tạo symbolic link
sudo ln -s /etc/nginx/sites-available/product-app /etc/nginx/sites-enabled/

# Xóa default site (tùy chọn)
sudo rm /etc/nginx/sites-enabled/default

# Test cấu hình
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Bước 4: Cấu hình Nginx khởi động cùng hệ thống
```bash
sudo systemctl enable nginx
```

#### Bước 5: Truy cập
Bây giờ bạn có thể truy cập ứng dụng qua:
```
http://<PUBLIC-IP>
```
Không cần `:3000` nữa!

### Cách 3: Thay đổi port trong app.js (Đơn giản nhất)

Sửa file `app.js`:
```bash
nano app.js
```

Thay đổi:
```javascript
app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
```

Thành:
```javascript
app.listen(80, () => {
    console.log("Server running at http://localhost:80");
});
```

**Lưu ý:** Cần chạy với `sudo` vì port 80 yêu cầu quyền root:
```bash
sudo pm2 start app.js --name "product-app"
```

---

## Troubleshooting

### Lỗi SSH Connection

**Lỗi: "Permission denied (publickey)"**
```bash
# Kiểm tra quyền file key
chmod 400 ten-file-key.pem

# Thử lại với verbose để xem chi tiết
ssh -v -i "ten-file-key.pem" ubuntu@<PUBLIC-IP>
```

**Lỗi: "Connection timed out"**
- Kiểm tra Security Group đã mở port 22 chưa
- Kiểm tra Public IP có đúng không
- Kiểm tra instance đã Running chưa

### Lỗi khi cài đặt Node.js

**Lỗi: "E: Unable to locate package"**
```bash
sudo apt update
sudo apt upgrade -y
```

**Lỗi: "npm command not found"**
```bash
# Cài lại Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Lỗi khi chạy ứng dụng

**Lỗi: "Cannot find module"**
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

**Lỗi: "ValidationException: Value null at 'tableName'"**
- Kiểm tra file `.env` có đúng tên biến không:
  - Phải là `DYNAMODB_TABLE` (không phải `DYNAMODB_TABLE_NAME`)
  - Phải là `S3_BUCKET_NAME` (không phải `AWS_S3_BUCKET_NAME`)
- Restart app sau khi sửa `.env`:
  ```bash
  pm2 restart product-app
  ```

**Lỗi: "Access Denied" khi truy cập S3/DynamoDB**
- Kiểm tra AWS credentials trong `.env`
- Kiểm tra IAM user có đủ quyền không
- Kiểm tra region có đúng không

**Lỗi: "Port 3000 already in use"**
```bash
# Tìm process đang dùng port 3000
sudo lsof -i :3000

# Hoặc
sudo netstat -tulpn | grep 3000

# Kill process
sudo kill -9 <PID>
```

### Lỗi PM2

**PM2 không tự động restart sau reboot**
```bash
# Chạy lại startup
pm2 startup
# Copy và chạy lệnh sudo được hiển thị

pm2 save
```

**Xem logs để debug**
```bash
pm2 logs product-app --err
pm2 logs product-app --out
```

### Không truy cập được web

**Kiểm tra Security Group:**
1. Vào AWS Console > EC2 > Security Groups
2. Tìm security group của instance
3. Kiểm tra Inbound rules có port 3000 (hoặc 80) không

**Kiểm tra app có chạy không:**
```bash
pm2 status
pm2 logs product-app
```

**Kiểm tra firewall trên EC2:**
```bash
sudo ufw status
# Nếu firewall đang chặn, mở port:
sudo ufw allow 3000
sudo ufw allow 80
```

---

## Kiểm tra và Bảo mật

### Checklist sau khi deploy:

- [ ] Ứng dụng truy cập được qua `http://<PUBLIC-IP>:3000`
- [ ] Có thể tạo, sửa, xóa products
- [ ] Upload hình ảnh lên S3 hoạt động
- [ ] PM2 đang chạy và auto-restart sau reboot
- [ ] File `.env` có quyền 600 (chỉ owner đọc được)
- [ ] Security Group chỉ mở port cần thiết
- [ ] SSH key được bảo quản an toàn

### Bảo mật:

1. **Không commit `.env` lên Git**
2. **Sử dụng IAM user với quyền tối thiểu** (không dùng root account)
3. **Giới hạn SSH access** trong Security Group (chỉ My IP)
4. **Cập nhật hệ thống định kỳ:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
5. **Sử dụng HTTPS** cho production (cần SSL certificate)
6. **Backup định kỳ** database và code

### Monitoring:

```bash
# Xem tài nguyên server
htop
# Hoặc
top

# Xem disk usage
df -h

# Xem memory
free -h

# Xem PM2 monitoring
pm2 monit
```

---

## Kết luận

Sau khi hoàn thành tất cả các bước trên, ứng dụng của bạn đã được deploy thành công lên AWS EC2!

**Truy cập ứng dụng:**
- URL: `http://<PUBLIC-IP>:3000`
- Hoặc: `http://<PUBLIC-IP>` (nếu đã cấu hình Nginx)

**Quản lý ứng dụng:**
- Xem logs: `pm2 logs product-app`
- Restart: `pm2 restart product-app`
- Stop: `pm2 stop product-app`

Chúc bạn deploy thành công! 🚀
