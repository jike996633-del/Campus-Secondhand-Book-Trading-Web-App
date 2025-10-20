const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// 验证登录中间件
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
  }
};

// 获取书籍列表（核心修复：分类筛选功能）
router.get('/', (req, res) => {
  const { category, search } = req.query;
  let query = `
    SELECT b.*, u.name as userName 
    FROM books b
    JOIN users u ON b.userId = u.id
    WHERE 1=1
  `;
  const params = [];
  
  // 分类筛选
  if (category && category !== 'all') {
    query += ' AND b.category = ?';
    params.push(category);
  }
  
  // 搜索筛选
  if (search) {
    query += ' AND (b.title LIKE ? OR b.author LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  // 执行查询
  req.db.all(query, params, (err, books) => {
    if (err) {
      return res.status(500).json({ success: false, message: '获取书籍失败' });
    }
    
    res.json({
      success: true,
      books
    });
  });
});

// 获取我的书籍
router.get('/my', authenticate, (req, res) => {
  req.db.all(
    `SELECT b.*, u.name as userName 
     FROM books b
     JOIN users u ON b.userId = u.id
     WHERE b.userId = ?`,
    [req.user.id],
    (err, books) => {
      if (err) {
        return res.status(500).json({ success: false, message: '获取我的书籍失败' });
      }
      
      res.json({
        success: true,
        books
      });
    }
  );
});

// 发布书籍（核心修复：确保发布后能显示）
router.post('/', authenticate, (req, res) => {
  const { title, author, category, price, condition, contact } = req.body;
  
  // 验证数据
  if (!title || !author || !category || !price || !condition || !contact) {
    return res.status(400).json({ success: false, message: '请填写完整信息' });
  }
  
  // 插入书籍
  req.db.run(
    `INSERT INTO books 
     (title, author, category, price, condition, contact, userId) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, author, category, price, condition, contact, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: '发布书籍失败' });
      }
      
      res.status(201).json({
        success: true,
        message: '书籍发布成功'
      });
    }
  );
});

// 删除书籍
router.delete('/:id', authenticate, (req, res) => {
  const bookId = req.params.id;
  
  // 检查权限
  req.db.get(
    'SELECT * FROM books WHERE id = ? AND userId = ?',
    [bookId, req.user.id],
    (err, book) => {
      if (err) {
        return res.status(500).json({ success: false, message: '数据库错误' });
      }
      
      if (!book) {
        return res.status(403).json({ success: false, message: '无权删除此书籍' });
      }
      
      // 删除书籍
      req.db.run(
        'DELETE FROM books WHERE id = ?',
        [bookId],
        (err) => {
          if (err) {
            return res.status(500).json({ success: false, message: '删除失败' });
          }
          
          res.json({
            success: true,
            message: '删除成功'
          });
        }
      );
    }
  );
});

module.exports = router;