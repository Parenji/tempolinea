<script lang="ts">
  import { safeColor } from '../format';
  // Una card della timeline. Non decide dove stare: riceve posizione e larghezza dal motore di layout
  // e gli restituisce la sua altezza reale (bind:height), così le card successive e le linee si adeguano.
  import type { CardBox } from '../engine/layout';
  import type { Category, TimelineEvent } from '../data/schema';
  import { formatDate } from '../data/dates';
  import { formatDescription } from '../format';

  interface Props {
    box: CardBox;
    event: TimelineEvent;
    categories: Category[];
    expanded: boolean;
    dimmed: boolean;
    /** azione che comunica al canvas l'altezza reale della card */
    measure: (node: HTMLElement) => { destroy: () => void };
    flash?: boolean;
    ontoggle: () => void;
    oncategory: (id: string) => void;
    onedit: () => void;
    onimage: (src: string, caption: string) => void;
  }
  let { box, event, categories, expanded, dimmed, flash = false, measure, ontoggle, oncategory, onedit, onimage }: Props = $props();

  const dateText = $derived.by(() => {
    let t = formatDate({ year: event.startYear, month: event.startMonth, day: event.startDay });
    if (event.endYear != null) t += ' – ' + formatDate({ year: event.endYear, month: event.endMonth, day: event.endDay });
    return t;
  });
  const cats = $derived(event.categoryIds.map((id) => categories.find((c) => c.id === id)).filter((c) => c != null));
</script>

<article
  class="card {box.kind}"
  class:expanded
  class:dimmed
  class:flash
  use:measure
  style:top="{box.top}px"
  style:left="{box.x}px"
  style:width="{box.width}px"
  style:--c1={box.color}
  style:--c2={box.color2 ?? box.color}
  data-event-id={box.id}
>
  <button type="button" class="head" onclick={ontoggle} aria-expanded={expanded}>
    <span class="date num">{dateText}</span>
    <span class="title">{event.title || 'Senza titolo'}</span>
    {#if event.imageUrl && !expanded}<span class="has-img" aria-label="con immagine">▣</span>{/if}
  </button>
  {#if expanded}
    <div class="body">
      {#if event.imageUrl}
        <button type="button" class="img" onclick={() => onimage(event.imageUrl!, event.title ?? '')} aria-label="Ingrandisci l'immagine">
          <img src={event.imageUrl} alt={event.title ?? ''} loading="lazy" />
        </button>
      {/if}
      {#if event.description}
        <p class="desc">{@html formatDescription(event.description)}</p>
      {/if}
      {#if cats.length}
        <div class="cats">
          {#each cats as c (c.id)}
            <button type="button" class="cat" style:--cat={safeColor(c.color)} onclick={() => oncategory(c.id)}>{c.name}</button>
          {/each}
        </div>
      {/if}
      <div class="actions">
        <button type="button" class="edit" onclick={onedit}>Modifica</button>
      </div>
    </div>
  {/if}
</article>

<style>
  .card {
    position: absolute;
    background: var(--panel);
    border: var(--border) solid var(--line);
    border-left: 6px solid var(--c1);
    border-radius: var(--radius-sm);
    box-shadow: 0 1px 0 var(--line);
    transition: opacity 0.2s, box-shadow 0.2s;
    z-index: 2;
  }
  /* due categorie: il bordo sinistro sfuma dalla prima alla seconda */
  .card { border-image: none; }
  .card::before {
    content: '';
    position: absolute; left: -6px; top: -2px; bottom: -2px; width: 6px;
    border-radius: var(--radius-sm) 0 0 var(--radius-sm);
    background: linear-gradient(var(--c1) 50%, var(--c2) 50%);
  }
  .note { border-style: dashed; border-left-style: solid; background: color-mix(in srgb, var(--panel) 85%, var(--paper)); }
  .expanded { z-index: 5; box-shadow: 0 8px 28px rgb(0 0 0 / 0.18); border-color: var(--c1); }
  .dimmed { opacity: 0.35; }

  .head {
    all: unset;
    box-sizing: border-box;
    display: flex; flex-direction: column; gap: 1px;
    width: 100%;
    padding: 6px 12px 8px;
    cursor: pointer;
    position: relative;
    -webkit-tap-highlight-color: transparent;
  }
  .head:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: var(--radius-sm); }
  .date { font-family: var(--font-display); font-weight: 600; font-size: 0.85em; color: var(--c1); }
  .title { font-weight: 800; font-size: 0.92em; line-height: 1.25; padding-right: 14px; }
  .has-img { position: absolute; top: 6px; right: 8px; font-size: 13px; color: var(--muted); }

  .body { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 10px; }
  .img { all: unset; display: block; cursor: zoom-in; border-radius: 8px; }
  .img:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  img { display: block; width: 100%; max-height: 260px; object-fit: cover; border-radius: 8px; background: var(--chip); }
  .desc { font-size: 0.9em; line-height: 1.5; }
  .cats { display: flex; flex-wrap: wrap; gap: 6px; }
  .cat {
    font: 700 13px var(--font-body); color: var(--ink); background: var(--chip);
    border: 0; border-radius: 999px; padding: 4px 10px 4px 8px; cursor: pointer;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .actions { display: flex; gap: 8px; }
  .edit {
    font: 700 14px var(--font-body); color: var(--ink); background: var(--panel);
    border: var(--border) solid var(--line); border-radius: 999px; padding: 6px 16px; min-height: 38px; cursor: pointer;
  }
  .edit:hover { border-color: var(--c1); }
  .flash { animation: flash 1.6s ease-out; }
  @keyframes flash { 0%, 30% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--c1) 45%, transparent); } 100% { box-shadow: 0 1px 0 var(--line); } }
  .cat::before { content: ''; width: 9px; height: 9px; border-radius: 50%; background: var(--cat); }
</style>
