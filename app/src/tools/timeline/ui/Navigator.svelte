<script lang="ts">
  import { t } from '$shared/i18n';
  import { untrack } from 'svelte';
  // "Vai a…": al posto della minimappa della v1. Si apre toccando l'anno in basso a sinistra:
  // un anno da raggiungere e una panoramica di quanti eventi ci sono in ogni epoca.
  import Dialog from '$shared/ui/Dialog.svelte';
  import Button from '$shared/ui/Button.svelte';
  import DateInput from './DateInput.svelte';
  import { overview, bucketLabel } from '../data/overview';
  import { signedYear, toParts, type DateParts } from '../data/ops';
  import type { Timeline } from '../data/schema';

  interface Props {
    open: boolean;
    timeline: Timeline;
    current: number | null;
    ongo: (year: number) => void;
  }
  let { open = $bindable(), timeline, current, ongo }: Props = $props();

  let target: DateParts = $state(toParts(null));
  $effect.pre(() => {
    if (open) untrack(() => (target = toParts(current)));
  });

  const data = $derived(open ? overview(timeline.events, 32) : { step: 1, buckets: [] });
  const maxCount = $derived(Math.max(1, ...data.buckets.map((b) => b.events)));
  const years = $derived(timeline.events.map((e) => e.startYear));

  function go(year: number) {
    open = false;
    ongo(year);
  }
</script>

<Dialog bind:open title={t('Vai a…')} width={520}>
  <form class="jump" onsubmit={(e) => { e.preventDefault(); const y = signedYear(target); if (y != null) go(y); }}>
    <DateInput id="nav-year" label={t('Anno')} yearOnly bind:value={target} />
    <Button variant="primary" type="submit">{t('Vai')}</Button>
  </form>
  <div class="row">
    <Button onclick={() => go(Math.min(...years))} disabled={!years.length}>{t('Inizio')}</Button>
    <Button onclick={() => go(Math.max(...years))} disabled={!years.length}>{t('Fine')}</Button>
  </div>

  {#if data.buckets.length}
    <div class="field">
      <span class="label">{data.step === 1 ? t('Panoramica: eventi per anno') : data.step === 100 ? t('Panoramica: eventi per secolo') : t('Panoramica: eventi ogni {n} anni', { n: data.step })}</span>
      <ul class="bars">
        {#each data.buckets as b (b.from)}
          {@const here = current != null && current >= b.from && current < b.to}
          <li>
            <button type="button" class:here onclick={() => go(b.from)} aria-label={t('{label}: {n} eventi', { label: bucketLabel(b, data.step), n: b.events })}>
              <span class="lbl num">{bucketLabel(b, data.step)}</span>
              <span class="bar"><span style:width="{(b.events / maxCount) * 100}%"></span></span>
              <span class="n num">{b.events || ''}</span>
              {#if b.periods}<span class="p" title={t('{n} periodi', { n: b.periods })}>{'▮'.repeat(Math.min(3, b.periods))}</span>{/if}
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</Dialog>

<style>
  .jump { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; }
  .bars { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
  .bars button {
    all: unset; box-sizing: border-box; width: 100%; cursor: pointer;
    display: grid; grid-template-columns: 9.5em 1fr 2.2em 2em; align-items: center; gap: 8px;
    padding: 4px 8px; border-radius: 8px; min-height: 32px;
  }
  .bars button:hover, .bars button:focus-visible { background: var(--chip); }
  .bars button.here { background: var(--accent-soft); box-shadow: inset 3px 0 0 var(--accent); }
  .lbl { font-size: 0.85em; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bar { height: 12px; border-radius: 6px; background: var(--chip); overflow: hidden; }
  .bar span { display: block; height: 100%; background: var(--accent); border-radius: 6px; }
  .n { font-size: 0.85em; font-weight: 800; text-align: right; }
  .p { font-size: 10px; color: var(--highlight); letter-spacing: 1px; }
</style>
