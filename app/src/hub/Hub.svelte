<script lang="ts">
  import AppHeader from '$shared/ui/AppHeader.svelte';
  import { syncDisplay } from '$shared/display.svelte';

  syncDisplay();

  const base = import.meta.env.BASE_URL;
  // Catalogo degli strumenti. Uno strumento "in arrivo" non ha ancora un link.
  const subjects = [
    {
      name: 'Storia', v: 'sto',
      tools: [{ title: 'Linea del tempo', desc: 'Eventi, periodi e collegamenti su una linea del tempo.', href: null as string | null }],
    },
    {
      name: 'Matematica', v: 'mat',
      tools: [{ title: 'Laboratorio dei quadrilateri', desc: 'Trascina i vertici e scopri angoli, lati paralleli e diagonali.', href: null as string | null }],
    },
  ];
</script>

<AppHeader title="Quaderno" home={false} />

<main>
  <p class="lead">Strumenti per studiare e fare lezione: funzionano su computer, iPad e proiettore.</p>
  {#each subjects as s}
    <section style:--accent="var(--{s.v})" style:--accent-soft="var(--{s.v}-soft)">
      <h2>{s.name}</h2>
      <div class="cards">
        {#each s.tools as t}
          <svelte:element this={t.href ? 'a' : 'div'} class="tool" href={t.href} aria-disabled={!t.href}>
            <h3>{t.title}</h3>
            <p class="muted">{t.desc}</p>
            {#if !t.href}<span class="soon">In arrivo</span>{/if}
          </svelte:element>
        {/each}
      </div>
    </section>
  {/each}
  <p class="muted foot"><a href="{base}stile/">Lo stile del Quaderno</a></p>
</main>

<style>
  main { max-width: 1000px; margin: 0 auto; padding: 24px 16px 48px; display: flex; flex-direction: column; gap: 28px; }
  .lead { font-size: 1.1em; }
  section { display: flex; flex-direction: column; gap: 12px; }
  h2 { color: var(--accent); }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--gap); }
  .tool {
    display: flex; flex-direction: column; gap: 6px; text-decoration: none; color: var(--ink);
    background: var(--panel); border: var(--border) solid var(--line); border-top: 6px solid var(--accent);
    border-radius: var(--radius); padding: 16px 20px;
  }
  a.tool:hover { border-color: var(--accent); }
  .soon { align-self: flex-start; font-size: 14px; font-weight: 800; color: var(--muted); background: var(--off-bg); border-radius: 999px; padding: 2px 10px; }
  .foot { font-size: 0.89em; }
</style>
