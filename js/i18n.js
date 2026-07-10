// ================================================================
//  I18N — Internationalization (Italian / English)
// ================================================================
const LANG_KEY = 'timeline_language';

const TRANSLATIONS = {
    it: {
        // ── General / Common ──
        save: 'Salva',
        cancel: 'Annulla',
        close: 'Chiudi',
        ok: 'Ok',
        no: 'No',
        confirm: 'Conferma',
        delete: 'Elimina',
        edit: 'Modifica',
        edit_f: 'Modifica',
        create: 'Crea',
        name: 'Nome',
        title_label: 'Titolo',
        description: 'Descrizione',
        image_url: 'URL Immagine',
        optional: 'Opzionale',
        none: 'Nessuna',
        all: 'Tutte',
        search: 'Cerca',
        loading: 'Caricamento...',
        error: 'Errore',
        success: 'Successo',
        info: 'Info',
        auto: 'Auto',

        // ── HTML page ──
        page_title: 'Timeline Storica',
        skip_to_content: 'Vai al contenuto',
        search_placeholder: 'Cerca anno o parola...',

        // ── Toolbar ──
        new_timeline_btn: 'Nuova',
        new_timeline_title: 'Crea una nuova timeline',
        edit_timeline_title: 'Modifica la timeline corrente',
        delete_timeline_title: 'Elimina la timeline corrente',
        shortcuts_title: 'Scorciatoie da tastiera (?)',
        undo_title: 'Annulla (Ctrl+Z)',
        redo_title: 'Ripeti (Ctrl+Shift+Z)',
        export_title: 'Esporta la timeline (E)',
        export_btn: 'Esporta',
        import_title: 'Importa una timeline (I)',
        import_btn: 'Importa',
        clear_all_title: 'Cancella tutti gli eventi',
        clear_all_btn: 'Svuota',
        settings_title: 'Impostazioni',
        settings_btn: 'Impostazioni',

        // ── Mobile Drawer ──
        mobile_menu: 'Menu',
        mobile_current_timeline: 'Timeline attuale',
        mobile_timeline_section: 'Timeline',
        mobile_new_timeline: 'Nuova Timeline',
        mobile_edit_timeline: 'Modifica',
        mobile_delete_timeline: 'Elimina Timeline',
        mobile_actions: 'Azioni',
        mobile_undo: 'Annulla',
        mobile_redo: 'Ripeti',
        mobile_export: 'Esporta',
        mobile_import: 'Importa',
        mobile_clear: 'Svuota',
        mobile_app: 'App',
        mobile_settings: 'Impostazioni',

        // ── Empty State ──
        empty_title: 'Timeline Vuota',
        empty_desc: 'Premi il pulsante in basso a destra per aggiungere il tuo primo evento, oppure...',
        empty_load_example: '📂 Carica timeline d\'esempio',
        empty_subtitle: '(Appunti di storia di Lorenzo)',

        // ── Zoom ──
        zoom_in: 'Zoom avanti (+)',
        zoom_out: 'Zoom indietro (-)',

        // ── FAB ──
        manage_categories: 'Gestisci categorie',
        create_new_event: 'Crea nuovo evento',

        // ── Event Modal ──
        modal_tab_event: 'Evento',
        modal_tab_period: 'Periodo',
        modal_tab_note: 'Appunto',
        new_event_title: 'Nuovo Evento',
        edit_event_title: 'Modifica Evento',
        new_period_title: 'Nuovo Periodo',
        edit_period_title: 'Modifica Periodo',
        new_note_title: 'Nuovo Appunto',
        edit_note_title: 'Modifica Appunto',
        convert_to_period: '🔄 Trasforma in Periodo',
        convert_to_period_desc: 'Converte l\'evento in un periodo con barra colorata sulla timeline.',
        convert_to_event: '🔄 Trasforma in Evento',
        convert_to_event_desc: 'Converte il periodo in un evento puntuale con card sulla timeline.',
        year_start: 'Anno Inizio',
        year_end: 'Anno Fine',
        month: 'Mese',
        day: 'Giorno',
        month_end: 'Mese Fine',
        day_end: 'Giorno Fine',
        year: 'Anno',
        required: '*',
        negative_year_hint: 'Negativo = a.C.',
        note_year_hint: 'Serve solo per il posizionamento, non verrà mostrato.',
        primary_category: 'Categoria principale',
        secondary_category: 'Categoria secondaria',
        select_category: 'Seleziona categoria...',
        linked_events: 'Eventi Collegati',
        search_event_to_link: 'Cerca evento da collegare...',
        no_linked_events: 'Nessun evento collegato.',
        event_not_found: '(evento non trovato)',
        already_linked: 'Evento già collegato',
        bold: 'Grassetto',
        italic: 'Corsivo',
        underline: 'Sottolineato',
        image_url_hint: 'Appare nella card espansa.',
        side_left_short: 'Sx',
        side_right_short: 'Dx',

        // ── Card Buttons ──
        card_edit: 'Modifica',
        card_delete: 'Elimina',
        card_edit_note: 'Modifica nota',
        card_delete_note: 'Elimina nota',

        // ── Category Modal ──
        category_modal_title: 'Gestione Categorie',
        new_category_btn: '+ Nuova Categoria',
        new_category_label: 'Nuova Categoria',
        edit_category_label: 'Modifica Categoria',
        category_name_placeholder: 'es. Politica, Cultura...',
        category_color: 'Colore',
        category_side_label: 'Lato preferito',
        category_side_auto: 'Automatico (alternato)',
        category_side_left: 'Preferibilmente a sinistra',
        category_side_right: 'Preferibilmente a destra',
        category_side_hint: 'Gli eventi potranno comunque cambiare lato se necessario per trovare spazio.',
        category_split_toggle: 'Dividi eventi',
        category_existing: 'Categorie Esistenti',
        category_select_mode: 'Seleziona',
        category_merge_btn: 'Unisci',
        category_delete_selection: 'Elimina',
        category_selection_cancel: 'Annulla',
        category_search_placeholder: 'Cerca categoria...',
        category_merge_name: 'Nome nuova categoria unificata',
        category_merge_example: 'es. Politica e Società',
        category_connectors_on: 'Disattiva linee',
        category_connectors_off: 'Attiva linee',
        category_edit_tooltip: 'Modifica',
        category_delete_tooltip: 'Elimina',
        category_no_events: 'Nessun evento in questa categoria.',
        category_events_count: 'eventi',
        category_without_lines: '(senza linee)',
        category_show_hide_events: 'Mostra/nascondi eventi di',
        custom_color: 'Colore personalizzato',
        split_new_category: '➕ Crea nuova categoria...',
        split_new_name: 'Nome nuova categoria',

        // ── Delete Confirm Modal ──
        delete_confirm_title: 'Conferma Cancella',
        delete_confirm_desc: 'Vuoi esportare i dati prima di cancellarli?',
        delete_export_and_delete: 'Ok',

        // ── Import Choice Modal ──
        import_choice_title: 'Importa Dati',
        import_choice_desc: 'La timeline corrente "<strong>{name}</strong>" contiene già eventi o categorie. Come vuoi procedere?',
        import_overwrite: 'Sovrascrivi timeline attuale',
        import_new_timeline: 'Crea una nuova timeline',

        // ── Timeline Modal ──
        timeline_new_title: 'Nuova Timeline',
        timeline_edit_title: 'Modifica Timeline',
        timeline_name_label: 'Nome Timeline',
        timeline_name_placeholder: 'es. Storia Antica',
        timeline_segments_toggle: 'Intervallo temporale',
        timeline_categories_toggle: 'Gestione categorie',
        segments_modal_title: 'Intervallo Temporale',
        segments_description: 'Definisci come lo spazio verticale della timeline è distribuito tra i vari periodi storici. Maggiore è la spaziatura, più spazio avrà quel periodo.',
        segments_header_start: 'Inizio',
        segments_header_end: 'Fine',
        segments_header_density: 'Spaziatura',
        segments_header_step: 'Passo righello',
        segments_add: '+ Aggiungi segmento',
        segments_reset: 'Ripristina default',
        segments_single: 'Segmento singolo',
        segments_count_singular: 'segmento',
        segments_count_plural: 'segmenti',
        segment_remove: '🗑 Rimuovi',
        density_min: 'Minima (0.25×)',
        density_very_low: 'Molto bassa (0.5×)',
        density_low: 'Bassa (1×)',
        density_med_low: 'Medio-bassa (3×)',
        density_normal: 'Normale (5×)',
        density_medium: 'Media (10×)',
        density_med_high: 'Medio-alta (20×)',
        density_high: 'Alta (40×)',
        density_very_high: 'Molto alta (60×)',
        density_max: 'Massima (100×)',
        density_custom: 'Personalizzata...',
        ruler_step_year: 'Anno (1)',
        ruler_step_decade: 'Decennio (10)',
        ruler_step_century: 'Secolo (100)',

        // ── Settings Modal ──
        settings_modal_title: 'Impostazioni',
        settings_show_pills: 'Mostra barra categorie',
        settings_show_pills_desc: 'Mostra o nascondi la barra delle categorie nella toolbar.',
        settings_language: 'Lingua',
        language_it: '🇮🇹 Italiano',
        language_en: '🇬🇧 English',

        // ── Shortcuts ──
        shortcuts_dialog_title: 'Scorciatoie da tastiera',
        shortcut_new_event: 'Nuovo evento',
        shortcut_save_event: 'Salva evento',
        shortcut_export: 'Esporta',
        shortcut_import: 'Importa',
        shortcut_close_modal: 'Chiudi modale',
        shortcut_zoom: 'Zoom',
        shortcut_search_focus: 'Cerca',
        shortcut_go_to_year: 'Vai all\'anno',
        shortcut_undo: 'Annulla',
        shortcut_redo: 'Ripeti',
        shortcut_help: 'Mostra/nascondi aiuto',

        // ── Quick Create ──
        quick_create_title: 'Crea in',
        quick_create_event: 'Nuovo Evento',
        quick_create_period: 'Nuovo Periodo',
        quick_create_note: 'Nuovo Appunto',

        // ── Boundary / Lock ──
        boundary_prev_years: 'Scopri anni precedenti (← {year})',
        boundary_next_years: 'Scopri anni successivi ({year} →)',
        boundary_unlock_top_aria: 'Sblocca scroll verso anni precedenti',
        boundary_unlock_bottom_aria: 'Sblocca scroll verso anni successivi',
        boundary_unlock_title: 'Clicca per esplorare gli anni senza eventi',
        lock_toggle_label: 'Blocca scroll',
        lock_toggle_aria: 'Riattiva restrizione scroll',
        lock_toggle_title: 'Limita lo scroll agli anni con eventi',

        // ── Toast Messages ──
        toast_nothing_to_undo: 'Niente da annullare',
        toast_undone: 'Annullato (Ctrl+Z)',
        toast_nothing_to_redo: 'Niente da ripetere',
        toast_redone: 'Ripetuto (Ctrl+Shift+Z)',
        toast_no_data_to_delete: 'Non ci sono dati da cancellare',
        toast_deleted: 'Dati cancellati',
        toast_exported_and_deleted: 'Dati esportati e cancellati',
        toast_segments_invalid_values: 'I valori di inizio e fine devono essere numeri validi.',
        toast_segment_end_gt_start: 'La fine del segmento deve essere maggiore dell\'inizio (segmento {n}).',
        toast_density_positive: 'La densità personalizzata del segmento {n} deve essere un numero positivo.',
        toast_segments_contiguous: 'I segmenti devono essere contigui: la fine del segmento {n1} deve coincidere con l\'inizio del segmento {n2}.',
        toast_segments_reset: 'Segmenti ripristinati ai valori predefiniti. Clicca Salva per confermare.',
        toast_event_created: 'Evento creato',
        toast_event_updated: 'Evento modificato',
        toast_event_deleted: 'Evento eliminato',
        toast_period_created: 'Periodo creato',
        toast_period_updated: 'Periodo modificato',
        toast_note_created: 'Appunto creato',
        toast_note_updated: 'Appunto modificato',
        toast_event_to_period: 'Evento trasformato in periodo',
        toast_period_to_event: 'Periodo trasformato in evento',
        toast_category_created: 'Categoria creata',
        toast_category_updated: 'Categoria modificata',
        toast_category_deleted: 'Categoria eliminata',
        toast_categories_deleted: '{n} categorie eliminate',
        toast_categories_merged: 'Categorie unite in {name}',
        toast_timeline_created: 'Timeline "{name}" creata',
        toast_timeline_updated: 'Timeline aggiornata',
        toast_timeline_deleted: 'Timeline eliminata',
        toast_timeline_renamed: 'Timeline rinominata',
        toast_timeline_switched: 'Timeline: {name}',
        toast_need_at_least_one: 'Devi avere almeno una timeline',
        toast_name_required: 'Inserisci un nome',
        toast_duplicate_name: 'Esiste già una timeline con questo nome',
        toast_data_exported: 'Dati esportati',
        toast_export_error: 'Errore durante esportazione',
        toast_invalid_file: 'File non valido',
        toast_import_error: 'Errore durante l\'importazione',
        toast_imported_into_current: 'Timeline "{name}" aggiornata con i dati importati',
        toast_imported_new: 'Timeline "{name}" importata',
        toast_example_loaded: 'Timeline d\'esempio "{name}" caricata',
        toast_example_loaded_existing: 'Timeline d\'esempio caricata: {name}',
        toast_example_error: 'Impossibile caricare la timeline d\'esempio: {error}',
        toast_min_year_title_error: 'Inserisci almeno l\'anno',
        toast_min_year_name_error: 'Inserisci almeno l\'anno e il nome',
        toast_year_start_end_name_error: 'Inserisci anno inizio, anno fine e nome',
        toast_max_periods_error: 'Limite raggiunto: in qualche punto di questo intervallo ci sarebbero troppi periodi simultanei',
        toast_already_period: 'È già un periodo',
        toast_no_end_date: 'L\'evento non ha una data di fine',
        toast_already_event: 'È già un evento',
        toast_confirm_delete_event: 'Eliminare questo evento?',
        toast_confirm_delete_all: 'Cancellare TUTTI i dati della timeline corrente?',
        toast_confirm_delete_all_after_export: 'Dati esportati. Cancellare TUTTI i dati?',
        toast_confirm_delete_timeline: 'Eliminare la timeline "{name}"?',
        toast_confirm_delete_category: 'Eliminare questa categoria? Gli eventi associati perderanno la categoria.',
        toast_confirm_delete_categories: 'Eliminare {n} categorie selezionate? Gli eventi associati perderanno la categoria.',
        toast_category_name_required: 'Inserisci il nome della categoria',
        toast_merge_name_required: 'Inserisci il nome della nuova categoria',
        toast_export_prompt: 'Salva con nome:',

        // ── Months ──
        month_jan: 'Gen',
        month_feb: 'Feb',
        month_mar: 'Mar',
        month_apr: 'Apr',
        month_may: 'Mag',
        month_jun: 'Giu',
        month_jul: 'Lug',
        month_aug: 'Ago',
        month_sep: 'Set',
        month_oct: 'Ott',
        month_nov: 'Nov',
        month_dec: 'Dic',
        bc_suffix: ' a.C.',

        // ── Misc ──
        image_enlarged: 'Immagine ingrandita',
        image_enlarged_with_title: 'Immagine ingrandita: {title}',
        image_for: 'Immagine per {title}',
        category_tooltip: 'Categoria',
        linked_events_tooltip: 'Eventi Collegati',
        event_aria: 'Evento: {title}',
        note_aria: 'Nota: {title}',
        period_aria: 'Periodo: {title}',
        filter_category_aria: 'Filtra categoria {name}',
        show_all_categories_aria: 'Mostra tutte le categorie',
        select_category_aria: 'Seleziona {name}',
        color_aria: 'Colore {color}',
        custom_color_aria: 'Selettore colore personalizzato',
        segment_start_aria: 'Inizio segmento {n}',
        segment_end_aria: 'Fine segmento {n}',
        segment_density_aria: 'Spaziatura segmento {n}',
        custom_density_aria: 'Densità personalizzata segmento {n}',
        close_aria: 'Chiudi',

        // ── Import legacy ──
        legacy_import_name: 'Timeline (importata dal backup)',
        legacy_import_name_prefix: 'Importata',
        legacy_import_name_suffix: '(legacy)',
    },

    en: {
        // ── General / Common ──
        save: 'Save',
        cancel: 'Cancel',
        close: 'Close',
        ok: 'OK',
        no: 'No',
        confirm: 'Confirm',
        delete: 'Delete',
        edit: 'Edit',
        edit_f: 'Edit',
        create: 'Create',
        name: 'Name',
        title_label: 'Title',
        description: 'Description',
        image_url: 'Image URL',
        optional: 'Optional',
        none: 'None',
        all: 'All',
        search: 'Search',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        info: 'Info',
        auto: 'Auto',

        // ── HTML page ──
        page_title: 'Historical Timeline',
        skip_to_content: 'Skip to content',
        search_placeholder: 'Search year or keyword...',

        // ── Toolbar ──
        new_timeline_btn: 'New',
        new_timeline_title: 'Create a new timeline',
        edit_timeline_title: 'Edit current timeline',
        delete_timeline_title: 'Delete current timeline',
        shortcuts_title: 'Keyboard shortcuts (?)',
        undo_title: 'Undo (Ctrl+Z)',
        redo_title: 'Redo (Ctrl+Shift+Z)',
        export_title: 'Export timeline (E)',
        export_btn: 'Export',
        import_title: 'Import a timeline (I)',
        import_btn: 'Import',
        clear_all_title: 'Delete all events',
        clear_all_btn: 'Clear',
        settings_title: 'Settings',
        settings_btn: 'Settings',

        // ── Mobile Drawer ──
        mobile_menu: 'Menu',
        mobile_current_timeline: 'Current Timeline',
        mobile_timeline_section: 'Timeline',
        mobile_new_timeline: 'New Timeline',
        mobile_edit_timeline: 'Edit',
        mobile_delete_timeline: 'Delete Timeline',
        mobile_actions: 'Actions',
        mobile_undo: 'Undo',
        mobile_redo: 'Redo',
        mobile_export: 'Export',
        mobile_import: 'Import',
        mobile_clear: 'Clear',
        mobile_app: 'App',
        mobile_settings: 'Settings',

        // ── Empty State ──
        empty_title: 'Empty Timeline',
        empty_desc: 'Press the button at the bottom right to add your first event, or...',
        empty_load_example: '📂 Load example timeline',
        empty_subtitle: '(Lorenzo\'s history notes)',

        // ── Zoom ──
        zoom_in: 'Zoom in (+)',
        zoom_out: 'Zoom out (-)',

        // ── FAB ──
        manage_categories: 'Manage categories',
        create_new_event: 'Create new event',

        // ── Event Modal ──
        modal_tab_event: 'Event',
        modal_tab_period: 'Period',
        modal_tab_note: 'Note',
        new_event_title: 'New Event',
        edit_event_title: 'Edit Event',
        new_period_title: 'New Period',
        edit_period_title: 'Edit Period',
        new_note_title: 'New Note',
        edit_note_title: 'Edit Note',
        convert_to_period: '🔄 Convert to Period',
        convert_to_period_desc: 'Converts the event into a period with a colored bar on the timeline.',
        convert_to_event: '🔄 Convert to Event',
        convert_to_event_desc: 'Converts the period into a point event with a card on the timeline.',
        year_start: 'Start Year',
        year_end: 'End Year',
        month: 'Month',
        day: 'Day',
        month_end: 'End Month',
        day_end: 'End Day',
        year: 'Year',
        required: '*',
        negative_year_hint: 'Negative = BC',
        note_year_hint: 'Only used for positioning, will not be shown.',
        primary_category: 'Primary Category',
        secondary_category: 'Secondary Category',
        select_category: 'Select category...',
        linked_events: 'Linked Events',
        search_event_to_link: 'Search event to link...',
        no_linked_events: 'No linked events.',
        event_not_found: '(event not found)',
        already_linked: 'Event already linked',
        bold: 'Bold',
        italic: 'Italic',
        underline: 'Underline',
        image_url_hint: 'Appears in the expanded card.',
        side_left_short: 'L',
        side_right_short: 'R',

        // ── Card Buttons ──
        card_edit: 'Edit',
        card_delete: 'Delete',
        card_edit_note: 'Edit note',
        card_delete_note: 'Delete note',

        // ── Category Modal ──
        category_modal_title: 'Manage Categories',
        new_category_btn: '+ New Category',
        new_category_label: 'New Category',
        edit_category_label: 'Edit Category',
        category_name_placeholder: 'e.g. Politics, Culture...',
        category_color: 'Color',
        category_side_label: 'Preferred side',
        category_side_auto: 'Automatic (alternating)',
        category_side_left: 'Preferably on the left',
        category_side_right: 'Preferably on the right',
        category_side_hint: 'Events can still switch sides if necessary to find space.',
        category_split_toggle: 'Split events',
        category_existing: 'Existing Categories',
        category_select_mode: 'Select',
        category_merge_btn: 'Merge',
        category_delete_selection: 'Delete',
        category_selection_cancel: 'Cancel',
        category_search_placeholder: 'Search category...',
        category_merge_name: 'New unified category name',
        category_merge_example: 'e.g. Politics and Society',
        category_connectors_on: 'Disable lines',
        category_connectors_off: 'Enable lines',
        category_edit_tooltip: 'Edit',
        category_delete_tooltip: 'Delete',
        category_no_events: 'No events in this category.',
        category_events_count: 'events',
        category_without_lines: '(no lines)',
        category_show_hide_events: 'Show/hide events of',
        custom_color: 'Custom color',
        split_new_category: '➕ Create new category...',
        split_new_name: 'New category name',

        // ── Delete Confirm Modal ──
        delete_confirm_title: 'Confirm Delete',
        delete_confirm_desc: 'Do you want to export the data before deleting?',
        delete_export_and_delete: 'OK',

        // ── Import Choice Modal ──
        import_choice_title: 'Import Data',
        import_choice_desc: 'The current timeline "<strong>{name}</strong>" already contains events or categories. How would you like to proceed?',
        import_overwrite: 'Overwrite current timeline',
        import_new_timeline: 'Create a new timeline',

        // ── Timeline Modal ──
        timeline_new_title: 'New Timeline',
        timeline_edit_title: 'Edit Timeline',
        timeline_name_label: 'Timeline Name',
        timeline_name_placeholder: 'e.g. Ancient History',
        timeline_segments_toggle: 'Time Range',
        timeline_categories_toggle: 'Category Management',
        segments_modal_title: 'Time Range',
        segments_description: 'Define how the vertical space of the timeline is distributed across historical periods. The higher the spacing, the more room that period will have.',
        segments_header_start: 'Start',
        segments_header_end: 'End',
        segments_header_density: 'Spacing',
        segments_header_step: 'Ruler Step',
        segments_add: '+ Add Segment',
        segments_reset: 'Reset to default',
        segments_single: 'Single segment',
        segments_count_singular: 'segment',
        segments_count_plural: 'segments',
        segment_remove: '🗑 Remove',
        density_min: 'Minimal (0.25×)',
        density_very_low: 'Very Low (0.5×)',
        density_low: 'Low (1×)',
        density_med_low: 'Medium-Low (3×)',
        density_normal: 'Normal (5×)',
        density_medium: 'Medium (10×)',
        density_med_high: 'Medium-High (20×)',
        density_high: 'High (40×)',
        density_very_high: 'Very High (60×)',
        density_max: 'Maximum (100×)',
        density_custom: 'Custom...',
        ruler_step_year: 'Year (1)',
        ruler_step_decade: 'Decade (10)',
        ruler_step_century: 'Century (100)',

        // ── Settings Modal ──
        settings_modal_title: 'Settings',
        settings_show_pills: 'Show category bar',
        settings_show_pills_desc: 'Show or hide the category bar in the toolbar.',
        settings_language: 'Language',
        language_it: '🇮🇹 Italian',
        language_en: '🇬🇧 English',

        // ── Shortcuts ──
        shortcuts_dialog_title: 'Keyboard Shortcuts',
        shortcut_new_event: 'New event',
        shortcut_save_event: 'Save event',
        shortcut_export: 'Export',
        shortcut_import: 'Import',
        shortcut_close_modal: 'Close modal',
        shortcut_zoom: 'Zoom',
        shortcut_search_focus: 'Search',
        shortcut_go_to_year: 'Go to year',
        shortcut_undo: 'Undo',
        shortcut_redo: 'Redo',
        shortcut_help: 'Show/hide help',

        // ── Quick Create ──
        quick_create_title: 'Create in',
        quick_create_event: 'New Event',
        quick_create_period: 'New Period',
        quick_create_note: 'New Note',

        // ── Boundary / Lock ──
        boundary_prev_years: 'Discover earlier years (← {year})',
        boundary_next_years: 'Discover later years ({year} →)',
        boundary_unlock_top_aria: 'Unlock scroll to earlier years',
        boundary_unlock_bottom_aria: 'Unlock scroll to later years',
        boundary_unlock_title: 'Click to explore years without events',
        lock_toggle_label: 'Lock scroll',
        lock_toggle_aria: 'Re-enable scroll restriction',
        lock_toggle_title: 'Restrict scroll to years with events',

        // ── Toast Messages ──
        toast_nothing_to_undo: 'Nothing to undo',
        toast_undone: 'Undone (Ctrl+Z)',
        toast_nothing_to_redo: 'Nothing to redo',
        toast_redone: 'Redone (Ctrl+Shift+Z)',
        toast_no_data_to_delete: 'No data to delete',
        toast_deleted: 'Data deleted',
        toast_exported_and_deleted: 'Data exported and deleted',
        toast_segments_invalid_values: 'Start and end values must be valid numbers.',
        toast_segment_end_gt_start: 'The segment end must be greater than the start (segment {n}).',
        toast_density_positive: 'The custom density of segment {n} must be a positive number.',
        toast_segments_contiguous: 'Segments must be contiguous: the end of segment {n1} must match the start of segment {n2}.',
        toast_segments_reset: 'Segments reset to default values. Click Save to confirm.',
        toast_event_created: 'Event created',
        toast_event_updated: 'Event updated',
        toast_event_deleted: 'Event deleted',
        toast_period_created: 'Period created',
        toast_period_updated: 'Period updated',
        toast_note_created: 'Note created',
        toast_note_updated: 'Note updated',
        toast_event_to_period: 'Event converted to period',
        toast_period_to_event: 'Period converted to event',
        toast_category_created: 'Category created',
        toast_category_updated: 'Category updated',
        toast_category_deleted: 'Category deleted',
        toast_categories_deleted: '{n} categories deleted',
        toast_categories_merged: 'Categories merged into {name}',
        toast_timeline_created: 'Timeline "{name}" created',
        toast_timeline_updated: 'Timeline updated',
        toast_timeline_deleted: 'Timeline deleted',
        toast_timeline_renamed: 'Timeline renamed',
        toast_timeline_switched: 'Timeline: {name}',
        toast_need_at_least_one: 'You must have at least one timeline',
        toast_name_required: 'Please enter a name',
        toast_duplicate_name: 'A timeline with this name already exists',
        toast_data_exported: 'Data exported',
        toast_export_error: 'Error during export',
        toast_invalid_file: 'Invalid file',
        toast_import_error: 'Error during import',
        toast_imported_into_current: 'Timeline "{name}" updated with imported data',
        toast_imported_new: 'Timeline "{name}" imported',
        toast_example_loaded: 'Example timeline "{name}" loaded',
        toast_example_loaded_existing: 'Example timeline loaded: {name}',
        toast_example_error: 'Unable to load example timeline: {error}',
        toast_min_year_title_error: 'Please enter at least the year',
        toast_min_year_name_error: 'Please enter at least the year and name',
        toast_year_start_end_name_error: 'Please enter start year, end year, and name',
        toast_max_periods_error: 'Limit reached: at some point in this range there would be too many simultaneous periods',
        toast_already_period: 'Already a period',
        toast_no_end_date: 'The event has no end date',
        toast_already_event: 'Already an event',
        toast_confirm_delete_event: 'Delete this event?',
        toast_confirm_delete_all: 'Delete ALL data from the current timeline?',
        toast_confirm_delete_all_after_export: 'Data exported. Delete ALL data?',
        toast_confirm_delete_timeline: 'Delete timeline "{name}"?',
        toast_confirm_delete_category: 'Delete this category? Associated events will lose the category.',
        toast_confirm_delete_categories: 'Delete {n} selected categories? Associated events will lose the category.',
        toast_category_name_required: 'Please enter the category name',
        toast_merge_name_required: 'Please enter the new category name',
        toast_export_prompt: 'Save as:',

        // ── Months ──
        month_jan: 'Jan',
        month_feb: 'Feb',
        month_mar: 'Mar',
        month_apr: 'Apr',
        month_may: 'May',
        month_jun: 'Jun',
        month_jul: 'Jul',
        month_aug: 'Aug',
        month_sep: 'Sep',
        month_oct: 'Oct',
        month_nov: 'Nov',
        month_dec: 'Dec',
        bc_suffix: ' BC',

        // ── Misc ──
        image_enlarged: 'Enlarged image',
        image_enlarged_with_title: 'Enlarged image: {title}',
        image_for: 'Image for {title}',
        category_tooltip: 'Category',
        linked_events_tooltip: 'Linked Events',
        event_aria: 'Event: {title}',
        note_aria: 'Note: {title}',
        period_aria: 'Period: {title}',
        filter_category_aria: 'Filter category {name}',
        show_all_categories_aria: 'Show all categories',
        select_category_aria: 'Select {name}',
        color_aria: 'Color {color}',
        custom_color_aria: 'Custom color picker',
        segment_start_aria: 'Segment {n} start',
        segment_end_aria: 'Segment {n} end',
        segment_density_aria: 'Segment {n} spacing',
        custom_density_aria: 'Segment {n} custom density',
        close_aria: 'Close',

        // ── Import legacy ──
        legacy_import_name: 'Timeline (imported from backup)',
        legacy_import_name_prefix: 'Imported',
        legacy_import_name_suffix: '(legacy)',
    }
};

let currentLang = localStorage.getItem(LANG_KEY) || 'it';

function t(key, params) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS['it'];
    let text = dict[key];
    if (text === undefined) {
        // Fallback to Italian
        text = TRANSLATIONS['it'][key];
        if (text === undefined) return key;
    }
    if (params) {
        Object.keys(params).forEach(function (k) {
            text = text.replace('{' + k + '}', params[k]);
        });
    }
    return text;
}

function setLanguage(lang) {
    if (lang !== 'it' && lang !== 'en') return;
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    applyI18n();
    // Re-render all dynamic content
    if (typeof fullRender === 'function') fullRender();
    if (typeof renderCategoryList === 'function') renderCategoryList();
}

function getCurrentLanguage() {
    return currentLang;
}

// Apply translations to all elements with data-i18n attribute
function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
        const key = el.getAttribute('data-i18n');
        if (!key) return;
        // Handle nested keys for title/placeholder/aria-label
        if (key.startsWith('title:')) {
            el.setAttribute('title', t(key.substring(6)));
        } else if (key.startsWith('placeholder:')) {
            el.setAttribute('placeholder', t(key.substring(12)));
        } else if (key.startsWith('aria-label:')) {
            el.setAttribute('aria-label', t(key.substring(11)));
        } else {
            el.textContent = t(key);
        }
    });

    // Update HTML lang attribute
    document.documentElement.lang = currentLang;

    // Update page title
    document.title = t('page_title');

    // Update settings language select if present
    var langSelect = document.getElementById('settingLanguage');
    if (langSelect) {
        langSelect.value = currentLang;
    }
}