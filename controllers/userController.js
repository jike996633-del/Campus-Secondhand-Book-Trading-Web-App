const bcrypt = require('bcrypt'); // 密码加密
const jwt = require('jsonwebtoken'); // 生成令牌
const db = require('../data/inMemoryDB'); // 内存存储

// 1. 用户注册接口
exports.register = async (req, res) => {
  try {
    const { studentId, name, password } = req.body;

    // 校验输入是否完整
    if (!studentId || !name || !password) {
      return res.status(400).json({ message: '学号、姓名、密码均为必填项' });
    }

    // 校验学号格式（8位数字）
    if (!/^\d{8}$/.test(studentId)) {
      return res.status(400).json({ message: '学号必须是8位数字' });
    }

    // 校验密码长度（至少6位）
    if (password.length < 6) {
      return res.status(400).json({ message: '密码至少6位' });
    }

    // 检查学号是否已注册
    const existingUser = db.users.findOne({ studentId });
    if (existingUser) {
      return res.status(400).json({ message: '该学号已注册' });
    }

    // 密码加密（防止明文存储）
    const salt = await bcrypt.genSalt(10); // 生成加密盐
    const hashedPassword = await bcrypt.hash(password, salt); // 加密密码

    // 存入内存
    const user = db.users.create({
      studentId,
      name,
      password: hashedPassword // 存储加密后的密码
    });

    // 生成令牌并返回响应（隐藏密码）
    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 2. 用户登录接口
exports.login = async (req, res) => {
  try {
    const { studentId, password } = req.body;

    // 校验输入
    if (!studentId || !password) {
      return res.status(400).json({ message: '请输入学号和密码' });
    }

    // 查找用户
    const user = db.users.findOne({ studentId });
    if (!user) {
      return res.status(401).json({ message: '学号或密码错误' });
    }

    // 验证密码（对比输入密码和加密密码）
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '学号或密码错误' });
    }

    // 生成令牌并返回响应
    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 辅助函数：生成JWT令牌并返回统一格式响应
const sendTokenResponse = (user, statusCode, res) => {
  // 生成令牌（包含用户ID，过期时间从环境变量获取）
  const token = jwt.sign(
    { id: user.id }, // 令牌中存储用户ID
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  // 返回响应（不包含密码）
  res.status(statusCode).json({
    success: true,
    token, // 登录令牌（前端需存储，后续接口携带）
    user: {
      id: user.id,
      studentId: user.studentId,
      name: user.name
    }
  });
};