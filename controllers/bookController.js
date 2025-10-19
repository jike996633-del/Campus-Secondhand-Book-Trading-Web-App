const db = require('../data/inMemoryDB'); // 内存存储

// 1. 获取书籍列表（支持分类筛选、分页）- 公开接口
exports.getBooks = (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    // 从内存查询书籍（按分类筛选）
    const books = db.books.find({ category });

    // 分页处理
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedBooks = books.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      count: paginatedBooks.length,
      totalPages: Math.ceil(books.length / limit),
      currentPage: parseInt(page),
      data: paginatedBooks
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 2. 关键词搜索书籍（匹配书名/作者）- 公开接口
exports.searchBooks = (req, res) => {
  try {
    const { keyword, page = 1, limit = 10 } = req.query;
    if (!keyword) {
      return res.status(400).json({ message: '请输入搜索关键词' });
    }

    // 从内存搜索书籍
    const books = db.books.find({ keyword, status: 'available' });

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedBooks = books.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      count: paginatedBooks.length,
      totalPages: Math.ceil(books.length / limit),
      currentPage: parseInt(page),
      data: paginatedBooks
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 3. 获取单本书籍详情 - 公开接口
exports.getBookById = (req, res) => {
  try {
    const bookId = parseInt(req.params.id); // 从URL参数获取ID
    const book = db.books.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: '书籍不存在' });
    }

    res.status(200).json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 4. 发布书籍 - 需登录接口
exports.createBook = (req, res) => {
  try {
    const { title, author, category, price, condition, contact } = req.body;

    // 校验必填字段
    if (!title || !author || !category || !price || !condition || !contact) {
      return res.status(400).json({ message: '所有字段均为必填项' });
    }

    // 校验价格为正数
    if (price < 0) {
      return res.status(400).json({ message: '价格不能为负数' });
    }

    // 校验分类是否合法
    const validCategories = ['教材', '课外书', '考试资料', '其他'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: '分类必须是：教材、课外书、考试资料、其他' });
    }

    // 存入内存（关联当前登录用户ID）
    const newBook = db.books.create({
      title,
      author,
      category,
      price: parseFloat(price), // 转换为数字
      condition,
      contact,
      user: req.user.id // 从认证中间件获取用户ID
    });

    res.status(201).json({ success: true, data: newBook });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 5. 编辑书籍 - 仅发布者可操作
exports.updateBook = (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    const book = db.books.findById(bookId);

    // 书籍不存在
    if (!book) {
      return res.status(404).json({ message: '书籍不存在' });
    }

    // 验证权限（仅发布者可编辑）
    if (book.user !== req.user.id) {
      return res.status(403).json({ message: '无权限编辑该书籍' });
    }

    // 更新书籍信息
    const updatedBook = db.books.updateById(bookId, req.body);
    res.status(200).json({ success: true, data: updatedBook });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 6. 删除书籍 - 仅发布者可操作
exports.deleteBook = (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    const book = db.books.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: '书籍不存在' });
    }

    if (book.user !== req.user.id) {
      return res.status(403).json({ message: '无权限删除该书籍' });
    }

    // 从内存中删除
    const deleted = db.books.deleteById(bookId);
    if (deleted) {
      return res.status(200).json({ success: true, data: {} });
    }
    res.status(500).json({ message: '删除失败' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 7. 标记书籍为已售出 - 仅发布者可操作
exports.markAsSold = (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    const book = db.books.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: '书籍不存在' });
    }

    if (book.user !== req.user.id) {
      return res.status(403).json({ message: '无权限操作该书籍' });
    }

    // 更新状态为已售出
    const updatedBook = db.books.updateById(bookId, { status: 'sold' });
    res.status(200).json({ success: true, data: updatedBook });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};