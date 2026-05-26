// ── Auth ──────────────────────────────────────────────────────────────────────

function getAdminUser() {
  return JSON.parse(localStorage.getItem('selwa_user') || 'null');
}

function adminLogout() {
  localStorage.removeItem('selwa_user');
  window.location.href = 'index.html';
}

function adminFetch(path, options = {}) {
  const user = getAdminUser();
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': user ? String(user.id) : '',
      ...(options.headers || {}),
    },
  });
}

// ── Navigation ────────────────────────────────────────────────────────────────

function showSection(name, btn) {
  document.querySelectorAll('.ad-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.ad-nav-item').forEach(b => b.classList.remove('active'));
  const section = document.getElementById('section-' + name);
  if (section) section.classList.add('active');
  if (btn) btn.classList.add('active');

  if (name === 'products') loadProducts();
  if (name === 'orders')   loadOrders();
  if (name === 'users')    loadUsers();
}

// ── Stats ─────────────────────────────────────────────────────────────────────

async function loadStats() {
  try {
    const res = await adminFetch('/api/admin/stats');
    if (!res.ok) return;
    const data = await res.json();
    document.getElementById('stat-users').textContent    = data.users    ?? 0;
    document.getElementById('stat-products').textContent = data.products ?? 0;
    document.getElementById('stat-orders').textContent   = data.orders   ?? 0;
    document.getElementById('stat-revenue').textContent  = 'Nu. ' + (data.revenue_nu ?? 0).toLocaleString();
  } catch (_) {}
}

// ── Products ──────────────────────────────────────────────────────────────────

async function loadProducts() {
  const tbody = document.getElementById('products-tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="ad-empty"><i class="bi bi-arrow-clockwise"></i>Loading…</td></tr>';
  try {
    const res = await adminFetch('/api/products');
    const products = await res.json();
    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="ad-empty"><i class="bi bi-box-seam"></i>No products yet.</td></tr>';
      return;
    }
    tbody.innerHTML = products.map(p => `
      <tr>
        <td style="color:#999">#${p.id}</td>
        <td style="font-weight:600">${esc(p.name)}</td>
        <td><span class="ad-badge ad-badge--user">${esc(p.category)}</span></td>
        <td>Nu. ${Number(p.price).toLocaleString()}</td>
        <td>${p.stock_quantity}</td>
        <td style="color:#999">${esc(p.artisan?.name || '—')}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="ad-btn ad-btn--ghost ad-btn--sm" onclick="openProductModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="ad-btn ad-btn--danger ad-btn--sm" onclick="openDeleteModal(${p.id})">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </td>
      </tr>`).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="7" class="ad-empty">Failed to load products.</td></tr>';
  }
}

// ── Product modal ─────────────────────────────────────────────────────────────

function openProductModal(product = null) {
  document.getElementById('product-modal-overlay').classList.add('open');
  document.getElementById('modal-error').style.display = 'none';
  document.getElementById('modal-title').textContent = product ? 'Edit product' : 'Add product';
  document.getElementById('modal-submit').textContent = product ? 'Save changes' : 'Save product';

  if (product) {
    document.getElementById('edit-product-id').value = product.id;
    document.getElementById('f-name').value      = product.name || '';
    document.getElementById('f-category').value  = product.category || '';
    document.getElementById('f-desc').value      = product.description || '';
    document.getElementById('f-price').value     = product.price || '';
    document.getElementById('f-stock').value     = product.stock_quantity || 0;
    document.getElementById('f-region').value    = product.region || '';
    document.getElementById('f-materials').value = product.materials || '';
    document.getElementById('f-image').value     = product.image_url || '';
  } else {
    document.getElementById('edit-product-id').value = '';
    ['f-name','f-category','f-desc','f-price','f-stock','f-region','f-materials','f-image']
      .forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('f-stock').value = 0;
  }
}

function closeProductModal() {
  document.getElementById('product-modal-overlay').classList.remove('open');
}

async function submitProduct() {
  const errEl  = document.getElementById('modal-error');
  const editID = document.getElementById('edit-product-id').value;
  errEl.style.display = 'none';

  const body = {
    name:           document.getElementById('f-name').value.trim(),
    category:       document.getElementById('f-category').value,
    description:    document.getElementById('f-desc').value.trim(),
    price:          parseFloat(document.getElementById('f-price').value) || 0,
    stock_quantity: parseInt(document.getElementById('f-stock').value, 10) || 0,
    region:         document.getElementById('f-region').value.trim(),
    materials:      document.getElementById('f-materials').value.trim(),
    image_url:      document.getElementById('f-image').value.trim(),
  };

  if (!body.name || !body.category || body.price <= 0) {
    errEl.textContent = 'Name, category, and a valid price are required.';
    errEl.style.display = 'block';
    return;
  }

  try {
    const url    = editID ? `/api/admin/products/${editID}` : '/api/admin/products';
    const method = editID ? 'PUT' : 'POST';
    const res    = await adminFetch(url, { method, body: JSON.stringify(body) });
    const data   = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save');
    closeProductModal();
    loadProducts();
    loadStats();
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = 'block';
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

let pendingDeleteID = null;

function openDeleteModal(id) {
  pendingDeleteID = id;
  document.getElementById('delete-modal-overlay').classList.add('open');
}

function closeDeleteModal() {
  pendingDeleteID = null;
  document.getElementById('delete-modal-overlay').classList.remove('open');
}

async function confirmDelete() {
  if (!pendingDeleteID) return;
  try {
    const res = await adminFetch(`/api/admin/products/${pendingDeleteID}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Failed to delete');
      return;
    }
    closeDeleteModal();
    loadProducts();
    loadStats();
  } catch (e) {
    alert('Failed to delete product.');
  }
}

// ── Orders ────────────────────────────────────────────────────────────────────

async function loadOrders() {
  const tbody = document.getElementById('orders-tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="ad-empty"><i class="bi bi-arrow-clockwise"></i>Loading…</td></tr>';
  try {
    const res = await adminFetch('/api/admin/orders');
    const orders = await res.json();
    if (!Array.isArray(orders) || !orders.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="ad-empty"><i class="bi bi-receipt"></i>No orders yet.</td></tr>';
      return;
    }
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td style="color:#999">#${o.id}</td>
        <td style="font-weight:600">${esc(o.user?.name || '—')}</td>
        <td style="color:#999">${esc(o.user?.email || '—')}</td>
        <td>Nu. ${Number(o.total_amount).toLocaleString()}</td>
        <td><span class="ad-badge ad-badge--${o.status}">${o.status}</span></td>
        <td style="color:#999">${fmtDate(o.created_at)}</td>
      </tr>`).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" class="ad-empty">Failed to load orders.</td></tr>';
  }
}

// ── Users ─────────────────────────────────────────────────────────────────────

async function loadUsers() {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '<tr><td colspan="5" class="ad-empty"><i class="bi bi-arrow-clockwise"></i>Loading…</td></tr>';
  try {
    const res = await adminFetch('/api/admin/users');
    const users = await res.json();
    if (!Array.isArray(users) || !users.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="ad-empty"><i class="bi bi-people"></i>No users yet.</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td style="color:#999">#${u.id}</td>
        <td style="font-weight:600">${esc(u.name)}</td>
        <td style="color:#999">${esc(u.email)}</td>
        <td><span class="ad-badge ${u.is_admin ? 'ad-badge--admin' : 'ad-badge--user'}">${u.is_admin ? 'Admin' : 'User'}</span></td>
        <td style="color:#999">${fmtDate(u.created_at)}</td>
      </tr>`).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" class="ad-empty">Failed to load users.</td></tr>';
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function fmtDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const user = getAdminUser();

  if (!user) {
    document.getElementById('access-denied').style.display = 'flex';
    return;
  }

  // Verify admin status with backend
  try {
    const res = await fetch('/api/admin/stats', {
      headers: { 'X-User-ID': String(user.id) },
    });
    if (!res.ok) {
      document.getElementById('access-denied').style.display = 'flex';
      return;
    }
    const stats = await res.json();
    document.getElementById('stat-users').textContent    = stats.users    ?? 0;
    document.getElementById('stat-products').textContent = stats.products ?? 0;
    document.getElementById('stat-orders').textContent   = stats.orders   ?? 0;
    document.getElementById('stat-revenue').textContent  = 'Nu. ' + (stats.revenue_nu ?? 0).toLocaleString();
  } catch (_) {
    document.getElementById('access-denied').style.display = 'flex';
    return;
  }

  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('ad-name').textContent = user.name;
  document.getElementById('ad-avatar').textContent =
    user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // Close modals on overlay click
  document.getElementById('product-modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeProductModal();
  });
  document.getElementById('delete-modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeDeleteModal();
  });
});
