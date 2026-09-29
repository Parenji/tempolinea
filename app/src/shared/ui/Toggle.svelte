<script lang="ts">
  interface Props {
    checked: boolean;
    label: string;
  }
  let { checked = $bindable(), label }: Props = $props();
</script>

<label class="toggle">
  <input type="checkbox" role="switch" bind:checked />
  <span class="track" aria-hidden="true"><span class="thumb"></span></span>
  <span>{label}</span>
</label>

<style>
  .toggle { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; min-height: var(--target); font-weight: 600; }
  input { position: absolute; opacity: 0; width: 1px; height: 1px; }
  .track {
    width: 44px; height: 26px; border-radius: 999px; flex: none;
    background: var(--off-bg); border: var(--border) solid var(--line);
    position: relative; transition: background 0.15s;
  }
  .thumb {
    position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%;
    background: var(--muted); transition: transform 0.15s, background 0.15s;
  }
  input:checked + .track { background: var(--accent); border-color: var(--accent); }
  input:checked + .track .thumb { transform: translateX(18px); background: var(--panel); }
  input:focus-visible + .track { outline: 3px solid var(--focus); outline-offset: 2px; }
</style>
