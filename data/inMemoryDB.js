// 内存存储用户数据（模拟数据库表）
let users = [];
// 内存存储书籍数据
let books = [];
// 自增ID计数器（模拟数据库自动生成ID）
let userIdCounter = 1;
let bookIdCounter = 1;

module.exports = {
  // 用户相关操作
  users: {
    // 按条件查询用户（支持学号或ID）
    findOne: (condition) => {
      if (condition.studentId) {
        return users.find(u => u.studentId === condition.studentId);
      }
      if (condition.id) {
        return users.find(u => u.id === condition.id);
      }
      return null;
    },
    // 创建新用户
    create: (userData) => {
      const newUser = {
        id: userIdCounter++, // 自增ID
        ...userData,
        createdAt: new Date()
      };
      users.push(newUser);
      return newUser;
    }
  },
  // 书籍相关操作
  books: {
    // 按条件查询书籍（分类、状态、关键词等）
    find: (condition = {}) => {
      let result = [...books];
      // 按分类筛选
      if (condition.category) {
        result = result.filter(b => b.category === condition.category);
      }
      // 按状态筛选（默认只查可售）
      if (condition.status || condition.status === undefined) {
        const status = condition.status || 'available';
        result = result.filter(b => b.status === status);
      }
      // 按用户ID筛选（仅自己发布的）
      if (condition.user) {
        result = result.filter(b => b.user === condition.user);
      }
      // 关键词搜索（书名/作者）
      if (condition.keyword) {
        const keyword = condition.keyword.toLowerCase();
        result = result.filter(b => 
          b.title.toLowerCase().includes(keyword) || 
          b.author.toLowerCase().includes(keyword)
        );
      }
      // 按创建时间倒序（最新在前）
      return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    // 按ID查询单本书籍
    findById: (id) => {
      return books.find(b => b.id === id);
    },
    // 创建书籍
    create: (bookData) => {
      const newBook = {
        id: bookIdCounter++,
        ...bookData,
        status: 'available', // 默认状态：可售
        createdAt: new Date()
      };
      books.push(newBook);
      return newBook;
    },
    // 更新书籍信息
    updateById: (id, updateData) => {
      const index = books.findIndex(b => b.id === id);
      if (index === -1) return null;
      books[index] = { ...books[index], ...updateData };
      return books[index];
    },
    // 删除书籍
    deleteById: (id) => {
      const initialLength = books.length;
      books = books.filter(b => b.id !== id);
      return books.length < initialLength; // 删除成功返回true
    }
  }
};