<script lang="ts">
  import { t } from '../i18n';
  // Finestra modale basata su <dialog>: il browser gestisce focus, Esc e accessibilità.
  // Su schermo stretto diventa un pannello che sale dal basso.
  import type { Snippet } from 'svelte';

  interface Props {
    open: boolean;
    title: string;
    /** larghezza massima su schermo largo */
    width?: number;
    onclose?: () => void;
    children: Snippet;
    footer?: Snippet;
    header?: Snippet;
  }
  let { open = $bindable(), title, width = 560, onclose, children, footer, header }: Props = $props();

  let dialog: HTMLDialogElement;
  $effect(() => {
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  });

  function close() {
    open = false;
    onclose?.();
  }
</script>

<dialog
  bind:this={dialog}
  style:--w="{width}px"
  aria-label={title}
  oncancel={(e) => { e.preventDefault(); close(); }}
>
  {#if open}
    <header>
      <h2>{title}</h2>
      <button type="button" class="x" onclick={close} aria-label={t('Chiudi')}>×</button>
    </header>
    {@render header?.()}
    <div class="body">{@render children()}</div>
    {#if footer}<footer>{@render footer()}</footer>{/if}
  {/if}
</dialog>

<style>
  dialog {
    width: min(var(--w), calc(100vw - 32px));
    max-height: min(88vh, 900px);
    padding: 0;
    border: var(--border) solid var(--line);
    border-radius: var(--radius);
    background: var(--panel);
    color: var(--ink);
    box-shadow: 0 20px 60px rgb(0 0 0 / 0.3);
    overflow: hidden;
    flex-direction: column;
  }
  dialog[open] { display: flex; }
  dialog::backdrop { background: rgb(15 20 35 / 0.45); }
  header {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 14px 16px 10px 22px;
  }
  h2 { font-size: 1.3em; }
  .x {
    width: var(--target); height: var(--target); flex: none;
    border: 0; background: none; color: var(--muted); font-size: 30px; line-height: 1; cursor: pointer; border-radius: 50%;
  }
  .x:hover { background: var(--chip); }
  .body { padding: 4px 22px 18px; overflow: auto; display: flex; flex-direction: column; gap: 16px; }
  footer {
    display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
    padding: 12px 22px 16px; border-top: var(--border) solid var(--line);
  }
  @media (max-width: 600px) {
    dialog {
      width: 100vw; max-width: 100vw; max-height: 92vh;
      margin: auto 0 0; border-radius: var(--radius) var(--radius) 0 0; border-bottom: 0;
    }
    .body { padding: 4px 16px 16px; }
    footer { padding: 10px 16px calc(12px + env(safe-area-inset-bottom)); }
  }
</style>
