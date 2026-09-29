// Mini-markdown delle descrizioni, come nella v1: **grassetto**, *corsivo*, __sottolineato__, a capo.
const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ESC[c]);
}

export function formatDescription(text: string | null | undefined): string {
  if (!text) return '';
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/\n/g, '<br>');
}

/**
 * I colori delle categorie li sceglie l'utente (la v1 aveva solo il tema scuro, quindi c'è anche il bianco).
 * Un colore quasi bianco o quasi nero sparirebbe su uno dei due temi: lo mescoliamo con il grigio del testo
 * secondario (--muted), che è scuro nel tema chiaro e chiaro in quello scuro.
 */
export function safeColor(color: string): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return color;
  const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return lum > 0.7 || lum < 0.012 ? `color-mix(in srgb, ${color} 15%, var(--muted))` : color;
}
