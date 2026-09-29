<script lang="ts">
  import { t } from '$shared/i18n';
  // Data storica: anno (positivo) + interruttore a.C./d.C., mese e giorno facoltativi.
  // Più chiaro del "numero negativo = a.C." della v1, soprattutto per ragazzi e insegnanti.
  import { MONTHS, type DateParts } from '../data/ops';

  interface Props {
    value: DateParts;
    label: string;
    id: string;
    required?: boolean;
    /** solo l'anno (per gli appunti) */
    yearOnly?: boolean;
    error?: string;
  }
  let { value = $bindable(), label, id, required = false, yearOnly = false, error }: Props = $props();

  const num = (s: string) => (s.trim() === '' ? null : Math.trunc(Number(s)));
</script>

<fieldset class="date" aria-describedby={error ? `${id}-err` : undefined}>
  <legend>{label}{required ? ' *' : ''}</legend>
  <div class="parts">
    <label class="year">
      <span class="visually-hidden">{t('Anno')}</span>
      <input
        id="{id}-year"
        type="number"
        inputmode="numeric"
        min="0"
        placeholder={t('Anno')}
        value={value.year ?? ''}
        aria-invalid={!!error}
        oninput={(e) => (value.year = num(e.currentTarget.value))}
      />
    </label>
    <div class="era" role="group" aria-label={t('Era')}>
      <button type="button" aria-pressed={!value.bc} onclick={() => (value.bc = false)}>{t('d.C.')}</button>
      <button type="button" aria-pressed={value.bc} onclick={() => (value.bc = true)}>{t('a.C.')}</button>
    </div>
    {#if !yearOnly}
      <label class="month">
        <span class="visually-hidden">{t('Mese')}</span>
        <select
          value={value.month ?? ''}
          onchange={(e) => {
            value.month = num(e.currentTarget.value);
            if (value.month == null) value.day = null;
          }}
        >
          <option value="">{t('Mese —')}</option>
          {#each MONTHS as m, i}<option value={i + 1}>{m}</option>{/each}
        </select>
      </label>
      <label class="day">
        <span class="visually-hidden">{t('Giorno')}</span>
        <input
          type="number"
          inputmode="numeric"
          min="1"
          max="31"
          placeholder={t('Giorno')}
          disabled={value.month == null}
          value={value.day ?? ''}
          oninput={(e) => (value.day = num(e.currentTarget.value))}
        />
      </label>
    {/if}
  </div>
  {#if error}<p class="error" id="{id}-err">{error}</p>{/if}
</fieldset>

<style>
  fieldset { border: 0; padding: 0; margin: 0; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  legend { font-weight: 800; font-size: 0.89em; padding: 0; margin-bottom: 6px; }
  .parts { display: flex; flex-wrap: wrap; gap: 8px; }
  .year { flex: 1 1 110px; max-width: 150px; }
  .month { flex: 1 1 140px; }
  .day { flex: 0 1 100px; }
  .era { display: flex; border: var(--border) solid var(--line); border-radius: 999px; overflow: hidden; flex: none; }
  .era button {
    border: 0; background: var(--panel); color: var(--ink); font: 800 0.9em var(--font-body);
    min-height: calc(var(--target) - 4px); padding: 0 12px; cursor: pointer;
  }
  .era button[aria-pressed='true'] { background: var(--ink); color: var(--paper); }
  .day input:disabled { opacity: 0.5; }
  .error { font-size: 0.85em; color: var(--bad); font-weight: 700; }
</style>
