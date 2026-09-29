// Preferenze di visualizzazione comuni a tutti gli strumenti (tema, modalità proiettore).
// Sono comodità di chi guarda: stanno nel localStorage e l'app funziona anche se non c'è.
export type Theme = 'auto' | 'light' | 'dark';

const KEY = 'quaderno.display';

function load(): { theme: Theme; projector: boolean } {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return {
      theme: ['auto', 'light', 'dark'].includes(saved.theme) ? saved.theme : 'auto',
      projector: saved.projector === true,
    };
  } catch {
    return { theme: 'auto', projector: false };
  }
}

export const display = $state(load());

function apply() {
  const root = document.documentElement;
  if (display.theme === 'auto') delete root.dataset.theme;
  else root.dataset.theme = display.theme;
  root.toggleAttribute('data-projector', display.projector);
  try {
    localStorage.setItem(KEY, JSON.stringify(display));
  } catch {
    /* modalità privata: pazienza */
  }
}

/** Da chiamare una volta nel componente radice di ogni pagina. */
export function syncDisplay() {
  $effect(() => {
    void display.theme;
    void display.projector;
    apply();
  });
}
