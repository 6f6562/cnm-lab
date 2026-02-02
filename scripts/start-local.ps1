# Script khởi động app local với DynamoDB Local trong Docker
# Sử dụng: .\scripts\start-local.ps1

Write-Host "🚀 Khởi động ứng dụng ở chế độ Local Development..." -ForegroundColor Cyan
Write-Host ""

# Kiểm tra Docker đang chạy
Write-Host "🔍 Kiểm tra Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker đang chạy" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker chưa chạy! Vui lòng khởi động Docker Desktop" -ForegroundColor Red
    exit 1
}

# Khởi động DynamoDB Local
Write-Host ""
Write-Host "📦 Khởi động DynamoDB Local..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Không thể khởi động DynamoDB Local" -ForegroundColor Red
    exit 1
}

# Đợi DynamoDB Local sẵn sàng
Write-Host "⏳ Đợi DynamoDB Local sẵn sàng..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Kiểm tra DynamoDB Local
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ DynamoDB Local đã sẵn sàng" -ForegroundColor Green
} catch {
    Write-Host "⚠️  DynamoDB Local có thể chưa sẵn sàng, nhưng sẽ tiếp tục..." -ForegroundColor Yellow
}

# Kiểm tra bảng Products
Write-Host ""
Write-Host "🔍 Kiểm tra bảng Products..." -ForegroundColor Yellow
node scripts/create-table.js

# Kiểm tra .env file
Write-Host ""
Write-Host "🔍 Kiểm tra file .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -notmatch "DYNAMODB_ENDPOINT=http://localhost:8000") {
        Write-Host "⚠️  Cảnh báo: DYNAMODB_ENDPOINT trong .env có thể không đúng cho local" -ForegroundColor Yellow
        Write-Host "💡 Đảm bảo DYNAMODB_ENDPOINT=http://localhost:8000 trong file .env" -ForegroundColor Yellow
    } else {
        Write-Host "✅ File .env đã được cấu hình đúng" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  File .env không tồn tại!" -ForegroundColor Yellow
    Write-Host "💡 Tạo file .env từ .env.local.example" -ForegroundColor Yellow
}

# Kiểm tra node_modules
Write-Host ""
Write-Host "🔍 Kiểm tra dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Cài đặt dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "✅ Dependencies đã được cài đặt" -ForegroundColor Green
}

# Khởi động app
Write-Host ""
Write-Host "✨ Khởi động ứng dụng..." -ForegroundColor Cyan
Write-Host "📊 DynamoDB Admin: http://localhost:8001" -ForegroundColor Cyan
Write-Host "🌐 Ứng dụng: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Nhấn Ctrl+C để dừng ứng dụng" -ForegroundColor Yellow
Write-Host ""

npm start
