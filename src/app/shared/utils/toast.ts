export type ToastType = 'success' | 'error' | 'warning' | 'info';

export function toast(message: string, type: ToastType = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `alert alert-${type === 'error' ? 'danger' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show mb-2`;
  el.innerHTML = `${message} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

export function showLoading(text = 'Cargando...') {
  const el = document.getElementById('loadingOverlay');
  const txt = document.getElementById('loadingText');
  if (el) el.style.display = 'flex';
  if (txt) txt.textContent = text;
}

export function hideLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = 'none';
}
