const db = require('../data/inMemoryDB');

// 获取书籍列表（支持分类筛选、分页）
exports.getBooks = async (req, res, next) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    // 从内存中查询
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
    next(error);
  }
};

// 关键词搜索书籍
exports.searchBooks = async (req, res, next) => {
  try {
    const { keyword, page = 1, limit = 10 } = req.query;
    if (!keyword) {
      return res.status(400).json({ message: '请输入搜索关键词' });
    }

    // 从内存中搜索
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
    next(error);
  }
};

// 获取单本书籍详情
exports.getBookById = async (req, res, next) => {
  try {
    const book = db.books.findById(parseInt(req.params.id));
    if (!book) {
      return res.status(404).json({ message: '书籍不存在' });
    }
    res.status(200).json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
};

// 发布书籍
exports.createBook = async (req, res, next) => {
  try {
    // 关联当前登录用户ID（内存中的用户id）
    const newBook = db.books.create({
      ...req.body,
      user: req.user.id // 从认证中间件获取
    });
    res.status(201).json({ success: true, data: newBook });
  } catch (error) {
    next(error);
  }
};

// 编辑书籍
exports.updateBook = async (req, res, next) => {
  try {
    const bookId = parseInt(req.params.id);
    const book = db.books.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: '书籍不存在' });
    }

    // 验证权限（仅发布者可编辑）
    if (book.user !== req.user.id) {
      return res.status(403).json({ message: '无权限编辑该书籍' });
    }

    // 更新内存中的书籍
    const updatedBook = db.books.updateById(bookId, req.body);
    res.status(200).json({ success: true, data: updatedBook });
  } catch (error) {
    next(error);
  }
};

// 删除书籍
exports.deleteBook = async (req, res, next) => {
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
    next(error);
  }
};

// 标记已售出
exports.markAsSold = async (req, res, next) => {
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
    next(error);
  }
};