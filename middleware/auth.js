const jwt = require('jsonwebtoken');
const db = require('../data/inMemoryDB'); // 引入内存存储模块

// 验证用户登录状态的中间件
exports.protect = (req, res, next) => {
  let token;

  // 从请求头获取token（格式：Bearer <token>）
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; // 提取token
  }

  // 没有token则返回未登录错误
  if (!token) {
    return res.status(401).json({ message: '未登录，请先登录' });
  }

  try {
    // 验证token有效性（用JWT_SECRET解密）
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 从内存中查询用户信息（挂载到req.user供后续接口使用）
    req.user = db.users.findOne({ id: decoded.id });
    if (!req.user) {
      return res.status(401).json({ message: '用户不存在' });
    }
    
    next(); // 认证通过，继续执行接口逻辑
  } catch (error) {
    // token无效或过期
    return res.status(401).json({ message: '登录状态失效，请重新登录' });
  }
};