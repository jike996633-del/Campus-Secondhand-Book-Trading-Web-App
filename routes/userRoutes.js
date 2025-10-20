const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 注册接口
router.post('/register', async (req, res) => {
  const { studentId, name, password } = req.body;
  const db = req.db; // 从req中获取数据库连接

  try {
    // 检查学号是否已注册
    db.get('SELECT * FROM users WHERE studentId = ?', [studentId], async (err, user) => {
      if (err) throw err;
      
      if (user) {
        return res.status(400).json({ message: '学号已被注册' });
      }
      
      // 密码加密
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // 创建用户
      db.run(
        'INSERT INTO users (studentId, name, password) VALUES (?, ?, ?)',
        [studentId, name, hashedPassword],
        function (err) {
          if (err) throw err;
          
          // 生成JWT
          const token = jwt.sign(
            { id: this.lastID },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
          );
          
          res.status(201).json({
            token,
            user: { id: this.lastID, studentId, name }
          });
        }
      );
    });
  } catch (err) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 其他接口（登录、获取用户信息等）类似，使用req.db操作数据库
// ...

module.exports = router;