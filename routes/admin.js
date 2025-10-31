const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');
const { ensureAuth } = require('../middleware/auth');

// 登录页
router.get('/login', (req, res) => {
  res.render('admin_login', { error: null });
});

// 登录提交
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.render('admin_login', { error: '用户不存在' });
    }
    const admin = rows[0];
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
      return res.render('admin_login', { error: '密码错误' });
    }
    req.session.adminUser = { id: admin.id, username: admin.username };
    res.redirect('/admin/targets');
  } catch (e) {
    console.error(e);
    res.render('admin_login', { error: '服务器错误' });
  }
});

// 退出登录
router.post('/logout', ensureAuth, (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// 目标站点管理页
router.get('/targets', ensureAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM targets ORDER BY created_at DESC');
    res.render('admin_targets', { targets: rows, user: req.session.adminUser });
  } catch (e) {
    console.error(e);
    res.status(500).send('服务器错误');
  }
});

// 添加新站点
router.post('/targets', ensureAuth, async (req, res) => {
  const { name, url } = req.body;
  try {
    await pool.query(
      'INSERT INTO targets (name, url, is_active, created_at) VALUES (?, ?, 1, NOW())',
      [name || null, url]
    );
    res.redirect('/admin/targets');
  } catch (e) {
    console.error(e);
    res.status(500).send('服务器错误');
  }
});

// 启用/停用站点
router.post('/targets/:id/toggle', ensureAuth, async (req, res) => {
  const id = req.params.id;
  const is_active = req.body.is_active === '1' ? 1 : 0;
  try {
    await pool.query('UPDATE targets SET is_active = ? WHERE id = ?', [is_active, id]);
    res.redirect('/admin/targets');
  } catch (e) {
    console.error(e);
    res.status(500).send('服务器错误');
  }
});

// 删除站点
router.post('/targets/:id/delete', ensureAuth, async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM targets WHERE id = ?', [id]);
    res.redirect('/admin/targets');
  } catch (e) {
    console.error(e);
    res.status(500).send('服务器错误');
  }
});

module.exports = router;