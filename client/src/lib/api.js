const API_URL = import.meta.env.VITE_API_URL || '';

export async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Errore API' }));
    throw new Error(error.message || 'Errore API');
  }

  return response.json();
}
