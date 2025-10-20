const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 注册接口（核心修复：完善注册功能）
router.post('/register', async (req, res) => {
  const { studentId, name, password } = req.body;
  
  // 验证请求数据
  if (!studentId || !name || !password) {
    return res.status(400).json({ success: false, message: '请填写完整信息' });
  }
  
  try {
    // 检查学号是否已注册
    req.db.get('SELECT * FROM users WHERE studentId = ?', [studentId], async (err, row) => {
      if (err) {
        return res.status(500).json({ success: false, message: '数据库错误' });
      }
      
      if (row) {
        return res.status(400).json({ success: false, message: '该学号已注册' });
      }
      
      // 密码加密
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // 插入新用户
      req.db.run(
        'INSERT INTO users (studentId, name, password) VALUES (?, ?, ?)',
        [studentId, name, hashedPassword],
        function (err) {
          if (err) {
            return res.status(500).json({ success: false, message: '注册失败' });
          }
          
          // 生成JWT
          const token = jwt.sign(
            { id: this.lastID, studentId },
            process.env.JWT_SECRET || 'dev-secret-key',
            { expiresIn: '7d' }
          );
          
          res.status(201).json({
            success: true,
            token,
            user: {
              id: this.lastID,
              studentId,
              name
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 登录接口（核心修复：确保登录后能关闭模态框）
router.post('/login', async (req, res) => {
  const { studentId, password } = req.body;
  
  // 验证请求数据
  if (!studentId || !password) {
    return res.status(400).json({ success: false, message: '请填写完整信息' });
  }
  
  // 查找用户
  req.db.get('SELECT * FROM users WHERE studentId = ?', [studentId], async (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, message: '数据库错误' });
    }
    
    if (!user) {
      return res.status(401).json({ success: false, message: '学号或密码错误' });
    }
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '学号或密码错误' });
    }
    
    // 生成JWT
    const token = jwt.sign(
      { id: user.id, studentId: user.studentId },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        studentId: user.studentId,
        name: user.name
      }
    });
  });
});

module.exports = router;