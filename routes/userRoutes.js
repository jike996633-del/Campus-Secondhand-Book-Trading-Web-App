const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/userController');

// 注册接口：POST /api/users/register
router.post('/register', register);

// 登录接口：POST /api/users/login
router.post('/login', login);

module.exports = router;