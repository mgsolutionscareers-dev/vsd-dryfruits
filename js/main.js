/**
 * Image upload helper, quick-add, event wiring and first render.
 */
let IMG = '';
function uploadFile(f, opt = {}) {
  if (!f) return Promise.reject(new Error('No file selected'));
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(f.type) && !/\.(jpe?g|png|webp)$/i.test(f.name)) {
    const err = 'Please upload a JPG, JPEG, PNG, or WebP image';
    toast(err);
    return Promise.reject(new Error(err));
  }
  if (f.size > 5 * 1024 * 1024) {
    const err = 'Image size must be less than 5 MB';
    toast(err);
    return Promise.reject(new Error(err));
  }
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const m = new Image();
      m.onload = () => {
        const mx = opt.mx || 800;
        const k = Math.min(1, mx / Math.max(m.width, m.height));
        const c = document.createElement('canvas');
        c.width = Math.round(m.width * k);
        c.height = Math.round(m.height * k);
        const ctx = c.getContext('2d');
        ctx.drawImage(m, 0, 0, c.width, c.height);
        const mime =
          f.type === 'image/png'
            ? 'image/png'
            : f.type === 'image/webp'
              ? 'image/webp'
              : 'image/jpeg';
        const dataUrl = c.toDataURL(mime, mime === 'image/png' ? undefined : 0.84);
        api('/api/admin/upload', { method: 'POST', body: { d: dataUrl } })
          .then((j) => resolve(j.url))
          .catch((e) => {
            toast(e.message);
            reject(e);
          });
      };
      m.onerror = () => {
        const err = 'Invalid image file';
        toast(err);
        reject(new Error(err));
      };
      m.src = r.result;
    };
    r.onerror = () => {
      const err = 'Failed to read file';
      toast(err);
      reject(new Error(err));
    };
    r.readAsDataURL(f);
  });
}

function up(i, t, mx, cb) {
  const f = i.files && i.files[0];
  if (!f) return;
  const el = typeof t === 'string' ? $('#' + t) : t;
  if (el) el.innerHTML = '<span style="font-size:12px;color:var(--m)">Uploading…</span>';
  uploadFile(f, { mx })
    .then((url) => {
      IMG = url;
      if (el) el.innerHTML = '<img src="' + url + '">';
      if (typeof cb === 'function') cb(url);
    })
    .catch(() => {});
}
function qa(t, id) {
  t == 'p' ? pd(id) : add('c', id, 0, 1);
}
addEventListener('hashchange', () => {
  D.stale = 1;
  cl();
  render();
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.sr')) {
    const d = $('#dd');
    d && (d.style.display = 'none');
  }
});
boot();

/*
 * HERO AUTO-SLIDE REMOVED.
 * The banner now changes only when the visitor clicks the arrows / dots
 * (or swipes on mobile). Nothing changes by itself.
 */

/** Start-up: load the catalogue from the server, check for an admin session, then draw the page. */
async function boot() {
  try {
    await loadCatalog();
  } catch (e) {
    $('#app').innerHTML =
      '<p style="padding:40px;text-align:center">Could not reach the server. Start it with <b>npm start</b> and open http://localhost:3000</p>';
    return;
  }
  try {
    await api('/api/admin/me');
    adm = true;
  } catch (e) {}
  render();
}
