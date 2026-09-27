// Local development editor only. Set VITE_ADMIN_PIN in the ignored .env.local file.
// Never use a browser-only PIN to protect a public production admin panel.
export const adminPin = import.meta.env.VITE_ADMIN_PIN || ''
