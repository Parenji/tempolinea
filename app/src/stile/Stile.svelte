<script lang="ts">
  import AppHeader from '$shared/ui/AppHeader.svelte';
  import Button from '$shared/ui/Button.svelte';
  import Chip from '$shared/ui/Chip.svelte';
  import Panel from '$shared/ui/Panel.svelte';
  import Segmented from '$shared/ui/Segmented.svelte';
  import Toggle from '$shared/ui/Toggle.svelte';
  import { syncDisplay } from '$shared/display.svelte';
  import QuadPreview from './QuadPreview.svelte';
  import TimelinePreview from './TimelinePreview.svelte';

  syncDisplay();

  const subjects = [
    { value: 'matematica', label: 'Matematica', v: 'mat' },
    { value: 'storia', label: 'Storia', v: 'sto' },
    { value: 'scienze', label: 'Scienze', v: 'sci' },
    { value: 'geografia', label: 'Geografia', v: 'geo' },
    { value: 'italiano', label: 'Italiano', v: 'ita' },
  ] as const;
  type Subject = (typeof subjects)[number]['value'];
  let subject = $state<Subject>('matematica');
  $effect(() => {
    document.documentElement.dataset.subject = subject;
  });

  const base = [
    ['paper', 'Carta'], ['panel', 'Riquadro'], ['ink', 'Inchiostro'], ['muted', 'Testo secondario'],
    ['line', 'Bordi'], ['grid', 'Quadretti'], ['highlight', 'Evidenziatore'], ['good', 'Giusto'], ['bad', 'Sbagliato'],
  ];

  let diagonals = $state(false);
  let snap = $state(true);
  let mode = $state<'libero' | 'trapezio' | 'parallelogramma'>('libero');
</script>

<AppHeader title="Lo stile del Quaderno" subject={subjects.find((s) => s.value === subject)?.label} />

<main>
  <section class="intro">
    <p class="lead">
      Un unico stile per tutti gli strumenti: carta a quadretti, inchiostro blu scuro, titoli in <b>Fredoka</b> e
      testo in <b>Nunito</b>. Ogni materia ha il suo colore. Prova il tema (☀ ☾) e la modalità
      <b>Proiettore</b> in alto a destra.
    </p>
    <Segmented label="Materia" options={subjects.map((s) => ({ value: s.value, label: s.label }))} bind:value={subject} />
  </section>

  <div class="grid two">
    <Panel eyebrow="Colori di base">
      <div class="swatches">
        {#each base as [v, label]}
          <div class="sw"><span style:background="var(--{v})"></span>{label}</div>
        {/each}
      </div>
    </Panel>
    <Panel eyebrow="Materie">
      <div class="swatches">
        {#each subjects as s}
          <div class="sw"><span style:background="var(--{s.v})"></span>{s.label}</div>
        {/each}
      </div>
      <p class="muted small">Il colore della materia diventa l'accento dello strumento: pulsanti principali, link, riempimenti delle figure.</p>
    </Panel>
  </div>

  <Panel eyebrow="Testo">
    <h1>Titolo della pagina</h1>
    <h2>Titolo di sezione</h2>
    <p>
      Testo normale a 18 px, abbastanza grande da leggersi da un banco in fondo all'aula. In modalità
      proiettore diventa 22 px. I numeri usano cifre allineate: <span class="num"><b>1492 · 360° · 3,14</b></span>.
    </p>
    <p class="muted">Testo secondario, per suggerimenti e spiegazioni.</p>
  </Panel>

  <Panel eyebrow="Controlli">
    <div class="row">
      <Button variant="primary">Controlla</Button>
      <Button>Ricomincia</Button>
      <Button variant="ghost">Mostra la soluzione</Button>
    </div>
    <Segmented
      label="Modalità"
      options={[
        { value: 'libero', label: 'Libero' },
        { value: 'trapezio', label: 'Trapezio' },
        { value: 'parallelogramma', label: 'Parallelogramma' },
      ]}
      bind:value={mode}
    />
    <div class="row">
      <Toggle label="Aggancia ai quadretti" bind:checked={snap} />
      <Toggle label="Mostra le diagonali" bind:checked={diagonals} />
    </div>
    <div class="row">
      <Chip>4 lati</Chip>
      <Chip tone="accent">lati opposti paralleli</Chip>
      <Chip tone="good">Giusto!</Chip>
      <Chip tone="bad">Riprova</Chip>
      <Chip color="#B03A7A">Lotta per le investiture</Chip>
    </div>
  </Panel>

  <div class="grid wide">
    <Panel eyebrow="Figura interattiva: trascina i vertici (anche con Tab e frecce)">
      <QuadPreview {diagonals} />
    </Panel>
  </div>

  <Panel eyebrow="Anteprima: la nuova linea del tempo">
    <p class="muted small">
      Le card e le linee condividono le stesse coordinate: le linee di categoria scendono vicino all'asse senza
      tornare indietro, il collegamento tra due eventi (tratteggiato) parte dal bordo delle card.
    </p>
    <TimelinePreview />
  </Panel>

  <Panel eyebrow="Scheda da stampare">
    <div class="sheet">
      <div class="sheet-head">
        <h2>I quadrilateri</h2>
        <span>Nome ____________ Classe ___ Data ________</span>
      </div>
      <p><b class="n">1.</b> Completa: un quadrilatero ha ___ lati, ___ vertici, ___ angoli e ___ diagonali.</p>
      <p><b class="n">2.</b> Â = 90°, B̂ = 90°, Ĉ = 120°. D̂ = __________</p>
    </div>
    <p class="muted small">Le schede usano gli stessi font, in bianco e nero, formato A4. Ogni strumento avrà il suo pulsante «Stampa».</p>
  </Panel>
</main>

<style>
  main { max-width: 1100px; margin: 0 auto; padding: 20px 16px 48px; display: flex; flex-direction: column; gap: var(--gap); }
  .intro { display: flex; flex-direction: column; gap: 14px; }
  .lead { font-size: 1.1em; max-width: 60ch; }
  .grid { display: grid; gap: var(--gap); }
  .two { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; }
  .swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
  .sw { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 0.89em; }
  .sw span { width: 36px; height: 36px; border-radius: 10px; border: var(--border) solid var(--line); flex: none; }
  .small { font-size: 0.89em; }
  .sheet { background: #fff; color: #1F2A44; border-radius: 4px; padding: 20px 24px; border: 1px solid var(--line); display: flex; flex-direction: column; gap: 10px; font-size: 16px; max-width: 640px; }
  .sheet-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 8px; border-bottom: 2px solid #1F2A44; padding-bottom: 6px; }
  .sheet-head span { font-size: 14px; }
  .sheet .n { color: #B4561A; font-family: var(--font-display); }
</style>
