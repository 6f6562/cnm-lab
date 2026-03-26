var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// Load config/.env sớm
require('./config/env');

var indexRouter = require('./routes/index');
var productsRouter = require('./routes/products');

const { ensureProductsTable } = require('./services/dynamoInit');
const imageStorageLocal = require('./services/imageStorageLocal');
const imageStorageS3 = require('./services/imageStorageS3');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  `/${process.env.LOCAL_UPLOAD_DIR || 'uploads'}`,
  express.static(path.join(__dirname, process.env.LOCAL_UPLOAD_DIR || 'uploads'))
);

app.use('/', indexRouter);
app.use('/products', productsRouter);

// Chọn service lưu ảnh theo cấu hình .env
const imageStorageProvider = process.env.IMAGE_STORAGE_PROVIDER || 'local';
app.locals.imageStorage = imageStorageProvider === 's3' ? imageStorageS3 : imageStorageLocal;

// Khởi tạo bảng DynamoDB (tự động khi server start)
ensureProductsTable().catch((err) => {
  // Không crash app nếu DynamoDB Local chưa sẵn sàng
  console.error('Failed to ensure DynamoDB Products table:', err?.message || err);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
