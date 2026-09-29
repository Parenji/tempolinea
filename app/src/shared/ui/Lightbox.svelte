<script lang="ts">
  // Immagine a tutto schermo. Si chiude toccando ovunque o con Esc.
  interface Props {
    src: string | null;
    caption?: string;
  }
  let { src = $bindable(), caption = '' }: Props = $props();

  let dialog: HTMLDialogElement;
  $effect(() => {
    if (src && !dialog.open) dialog.showModal();
    else if (!src && dialog.open) dialog.close();
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions (Esc è gestito da <dialog>) -->
<dialog bind:this={dialog} aria-label={caption || 'Immagine'} onclick={() => (src = null)} onclose={() => (src = null)}>
  {#if src}
    <figure>
      <img {src} alt={caption} />
      {#if caption}<figcaption>{caption}</figcaption>{/if}
    </figure>
    <button type="button" class="x" aria-label="Chiudi">×</button>
  {/if}
</dialog>

<style>
  dialog { border: 0; padding: 0; background: transparent; max-width: 100vw; max-height: 100vh; width: 100vw; height: 100vh; cursor: zoom-out; }
  dialog::backdrop { background: rgb(0 0 0 / 0.88); }
  figure { margin: 0; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px; box-sizing: border-box; }
  img { max-width: 100%; max-height: calc(100% - 60px); object-fit: contain; border-radius: 8px; }
  figcaption { color: #fff; font: 700 18px var(--font-body); text-align: center; }
  .x { position: fixed; top: 12px; right: 12px; width: 48px; height: 48px; border-radius: 50%; border: 0; background: rgb(255 255 255 / 0.15); color: #fff; font-size: 30px; cursor: pointer; }
</style>
