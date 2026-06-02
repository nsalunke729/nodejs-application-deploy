async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function fmt(dateStr) {
  return new Date(dateStr).toLocaleString();
}

// --- Health check ---
async function checkHealth() {
  const badge = document.getElementById('statusBadge');
  const uptime = document.getElementById('serviceUptime');
  try {
    const data = await fetchJSON('/api/health');
    badge.textContent = data.status.toUpperCase();
    badge.className = 'status-badge ok';
    uptime.textContent = `${Math.floor(data.uptime)}s`;
  } catch {
    badge.textContent = 'DOWN';
    badge.className = 'status-badge error';
    uptime.textContent = 'N/A';
  }
}

// --- Users ---
async function loadUsers() {
  const tbody = document.getElementById('usersBody');
  const count = document.getElementById('userCount');
  try {
    const { users } = await fetchJSON('/api/users');
    count.textContent = users.length;
    tbody.innerHTML = users.length
      ? users.map(u => `<tr><td>${u.id}</td><td>${u.name}</td><td>${u.email}</td><td>${fmt(u.created_at)}</td></tr>`).join('')
      : '<tr><td colspan="4" class="empty">No users yet</td></tr>';
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">${e.message}</td></tr>`;
  }
}

document.getElementById('userForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = document.getElementById('userError');
  err.textContent = '';
  const fd = new FormData(e.target);
  try {
    await fetchJSON('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fd.get('name'), email: fd.get('email') }),
    });
    e.target.reset();
    closeModal('userModal');
    loadUsers();
  } catch (ex) {
    err.textContent = ex.message;
  }
});

// --- Products ---
async function loadProducts() {
  const tbody = document.getElementById('productsBody');
  const count = document.getElementById('productCount');
  try {
    const { products } = await fetchJSON('/api/products');
    count.textContent = products.length;
    tbody.innerHTML = products.length
      ? products.map(p => `<tr><td>${p.id}</td><td>${p.name}</td><td>${p.description || '—'}</td><td>$${Number(p.price).toFixed(2)}</td><td>${p.stock}</td><td>${fmt(p.created_at)}</td></tr>`).join('')
      : '<tr><td colspan="6" class="empty">No products yet</td></tr>';
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty">${e.message}</td></tr>`;
  }
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = document.getElementById('productError');
  err.textContent = '';
  const fd = new FormData(e.target);
  try {
    await fetchJSON('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fd.get('name'),
        description: fd.get('description'),
        price: parseFloat(fd.get('price')),
        stock: parseInt(fd.get('stock'), 10),
      }),
    });
    e.target.reset();
    closeModal('productModal');
    loadProducts();
  } catch (ex) {
    err.textContent = ex.message;
  }
});

// --- Modals ---
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', (e) => { if (e.target === el) closeModal(el.id); });
});

// --- Init ---
checkHealth();
loadUsers();
loadProducts();
