#!/bin/bash

# Script khởi động app local với DynamoDB Local trong Docker
# Sử dụng: ./scripts/start-local.sh

echo "🚀 Khởi động ứng dụng ở chế độ Local Development..."
echo ""

# Kiểm tra Docker đang chạy
echo "🔍 Kiểm tra Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker chưa chạy! Vui lòng khởi động Docker"
    exit 1
fi
echo "✅ Docker đang chạy"

# Khởi động DynamoDB Local
echo ""
echo "📦 Khởi động DynamoDB Local..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Không thể khởi động DynamoDB Local"
    exit 1
fi

# Đợi DynamoDB Local sẵn sàng
echo "⏳ Đợi DynamoDB Local sẵn sàng..."
sleep 5

# Kiểm tra DynamoDB Local
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "✅ DynamoDB Local đã sẵn sàng"
else
    echo "⚠️  DynamoDB Local có thể chưa sẵn sàng, nhưng sẽ tiếp tục..."
fi

# Kiểm tra bảng Products
echo ""
echo "🔍 Kiểm tra bảng Products..."
node scripts/create-table.js

# Kiểm tra .env file
echo ""
echo "🔍 Kiểm tra file .env..."
if [ -f ".env" ]; then
    if ! grep -q "DYNAMODB_ENDPOINT=http://localhost:8000" .env; then
        echo "⚠️  Cảnh báo: DYNAMODB_ENDPOINT trong .env có thể không đúng cho local"
        echo "💡 Đảm bảo DYNAMODB_ENDPOINT=http://localhost:8000 trong file .env"
    else
        echo "✅ File .env đã được cấu hình đúng"
    fi
else
    echo "⚠️  File .env không tồn tại!"
    echo "💡 Tạo file .env từ .env.local.example"
fi

# Kiểm tra node_modules
echo ""
echo "🔍 Kiểm tra dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📦 Cài đặt dependencies..."
    npm install
else
    echo "✅ Dependencies đã được cài đặt"
fi

# Khởi động app
echo ""
echo "✨ Khởi động ứng dụng..."
echo "📊 DynamoDB Admin: http://localhost:8001"
echo "🌐 Ứng dụng: http://localhost:3000"
echo ""
echo "Nhấn Ctrl+C để dừng ứng dụng"
echo ""

npm start
