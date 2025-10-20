require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // 新增：处理文件路径
const sqlite3 = require('sqlite3').verbose(); // 新增：数据库
const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 新增：连接SQLite数据库并初始化表
const db = new sqlite3.Database('./campus_books.db', (err) => {
  if (err) {
    console.error('数据库连接错误:', err.message);
  } else {
    console.log('成功连接到SQLite数据库');
    initTables(); // 初始化数据表
  }
});

// 新增：暴露数据库给路由使用（通过req.db访问）
app.use((req, res, next) => {
  req.db = db;
  next();
});

// 修改：更严格的跨域配置（允许前端访问）
app.use(cors({
  origin: `http://localhost:${PORT}`,
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // 新增：提供前端静态文件

// 保留你的路由挂载
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);

// 修改：根路由返回前端页面（替代原来的文本响应）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 保留你的全局错误处理
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 新增：初始化数据表（用户、书籍、交易记录）
function initTables() {
  // 用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 书籍表
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      condition TEXT NOT NULL,
      contact TEXT NOT NULL,
      status TEXT DEFAULT 'available', -- available/sold
      userId INTEGER NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // 交易记录表（可选）
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookId INTEGER NOT NULL,
      buyerId INTEGER NOT NULL,
      sellerId INTEGER NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bookId) REFERENCES books(id),
      FOREIGN KEY (buyerId) REFERENCES users(id),
      FOREIGN KEY (sellerId) REFERENCES users(id)
    )
  `);
}

// 导出db供路由使用（如果需要）
module.exports = db;