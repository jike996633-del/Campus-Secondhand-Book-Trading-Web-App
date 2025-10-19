const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // 认证中间件
const {
  getBooks,
  searchBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  markAsSold,
} = require('../controllers/bookController');

// 公开路由（无需登录）
router.get('/', getBooks); // 书籍列表
router.get('/search', searchBooks); // 关键词搜索
router.get('/:id', getBookById); // 书籍详情

// 需登录的路由（用protect中间件保护）
router.post('/', protect, createBook); // 发布书籍
router.put('/:id', protect, updateBook); // 编辑书籍
router.delete('/:id', protect, deleteBook); // 删除书籍
router.patch('/:id/sold', protect, markAsSold); // 标记已售出

module.exports = router;