function pingUrl(url, timeout = 5000) {
  return new Promise((resolve) => {
    const start = performance.now();
    const img = new Image();
    const timer = setTimeout(() => {
      img.src = ''; // cancel
      resolve({ url, time: Infinity });
    }, timeout);

    img.onload = img.onerror = () => {
      clearTimeout(timer);
      const end = performance.now();
      resolve({ url, time: end - start });
    };

    try {
      const u = new URL(url);
      // 通过加载 favicon.ico（最常见的静态小文件）进行测量，并加上 cache-busting
      const probe = `${u.origin}/favicon.ico?cb=${Date.now()}`;
      // 不需要跨域凭证，仅测量加载/错误触发的时间
      img.referrerPolicy = 'no-referrer';
      img.src = probe;
    } catch (e) {
      clearTimeout(timer);
      resolve({ url, time: Infinity });
    }
  });
}

async function chooseFastestAndRedirect(targets) {
  const statusEl = document.getElementById('status');

  if (!targets || targets.length === 0) {
    statusEl.innerText = '暂无可用跳转目标';
    return;
  }

  statusEl.innerText = '正在为您选择最快的节点...';

  try {
    const results = await Promise.all(targets.map(t => pingUrl(t.url, 5000)));
    results.sort((a, b) => a.time - b.time);

    const fastest = results[0];
    if (!fastest || !isFinite(fastest.time)) {
      statusEl.innerText = '无法探测到可用节点，请稍后重试';
      return;
    }

    statusEl.innerText = `已为您选定最快节点（~${Math.round(fastest.time)}ms），正在跳转...`;
    setTimeout(() => {
      window.location.href = fastest.url;
    }, 500);
  } catch (e) {
    console.error(e);
    statusEl.innerText = '测速出现异常，请稍后重试';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const targets = window.targets || [];
  chooseFastestAndRedirect(targets);
});