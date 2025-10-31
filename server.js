require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const pool = require('./db');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// 首页：输出目标站点列表给前端进行用户侧测速并跳转
app.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, url, name FROM targets WHERE is_active = 1');
    res.render('index', { targets: rows });
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

// 管理员路由
app.use('/admin', adminRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started: http://localhost:${port}`);
});