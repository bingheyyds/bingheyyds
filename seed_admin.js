require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./db');

(async () => {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.error('请在 .env 中设置 ADMIN_USERNAME 和 ADMIN_PASSWORD');
    process.exit(1);
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [username, hash]);
    console.log('管理员已创建:', username);
    process.exit(0);
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      console.log('管理员已存在，跳过创建');
      process.exit(0);
    }
    console.error(e);
    process.exit(1);
  }
})();