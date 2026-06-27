// ================================================================
//  KEYBOARD SHORTCUTS
// ================================================================
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
        // Don't trigger shortcuts when typing in inputs/textareas
        const tag = (e.target.tagName || '').toLowerCase();
        const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
        // Allow Escape even in inputs
        if (e.key === 'Escape' && isInput) {
            e.target.blur();
            return;
        }
        if (isInput) return;

        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;

        if (e.key === 'Escape') {
            e.preventDefault();
            // Close lightbox first if open
            const lightbox = document.getElementById('imageLightbox');
            if (lightbox && lightbox.classList.contains('open')) {
                closeImageLightbox();
                return;
            }
            // Close shortcuts hint
            const hint = document.getElementById('shortcutsHint');
            if (hint && hint.classList.contains('open')) { hint.classList.remove('open'); return; }
            // Close any open modal
            if (document.getElementById('eventModal').classList.contains('open')) { closeModal(); return; }
            if (document.getElementById('categoryModal').classList.contains('open')) { closeCategoryModal(); return; }
            if (document.getElementById('deleteConfirmModal').classList.contains('open')) { closeDeleteModal(); return; }
            if (document.getElementById('timelineModal').classList.contains('open')) { closeTimelineModal(); return; }
            if (document.getElementById('importChoiceModal').classList.contains('open')) { closeImportChoiceModal(); return; }
            // Deselect periods
            document.querySelectorAll('.period-strip.active').forEach(function (el) { el.classList.remove('active'); });
            document.querySelectorAll('.period-detail-card.visible').forEach(function (el) { el.classList.remove('visible'); });
        }

        if (e.key === 's' && !ctrl) {
            e.preventDefault();
            const eventModal = document.getElementById('eventModal');
            if (eventModal && eventModal.classList.contains('open')) {
                document.getElementById('eventForm').requestSubmit();
            }
            return;
        }

        if (e.key === 'e' && !ctrl) {
            e.preventDefault();
            exportData();
            return;
        }

        if (e.key === 'i' && !ctrl) {
            e.preventDefault();
            document.getElementById('importInput').click();
            return;
        }

        if (e.key === 'n' && !ctrl) {
            e.preventDefault();
            openModal();
            return;
        }

        if ((e.key === '=' || e.key === '+') && !ctrl) {
            e.preventDefault();
            zoomIn();
            return;
        }

        if (e.key === '-' && !ctrl) {
            e.preventDefault();
            zoomOut();
            return;
        }

        if (e.key === 'f' && !ctrl) {
            e.preventDefault();
            document.getElementById('searchInput').focus();
            return;
        }

        if (e.key === 'g' && !ctrl) {
            e.preventDefault();
            const indicator = document.getElementById('yearIndicator');
            if (indicator) {
                indicator.classList.add('visible');
                indicator.click();
            }
            return;
        }

        if (ctrl && e.key === 'z' && !shift) {
            e.preventDefault();
            undo();
            return;
        }

        if (ctrl && (e.key === 'Z' || (e.key === 'z' && shift))) {
            e.preventDefault();
            redo();
            return;
        }

        if (e.key === '?' || (e.key === '/' && shift)) {
            e.preventDefault();
            toggleShortcutsHint();
            return;
        }
    });
}

function toggleShortcutsHint() {
    let hint = document.getElementById('shortcutsHint');
    if (!hint) {
        hint = document.createElement('div');
        hint.id = 'shortcutsHint';
        hint.className = 'shortcuts-hint';
        hint.setAttribute('role', 'dialog');
        hint.setAttribute('aria-label', 'Scorciatoie da tastiera');
        hint.setAttribute('aria-modal', 'true');
        hint.innerHTML =
            '<button class="shortcuts-hint-close" onclick="document.getElementById(\'shortcutsHint\').classList.remove(\'open\')" aria-label="Chiudi">×</button>' +
            '<h3>Scorciatoie da tastiera</h3>' +
            '<div><kbd>N</kbd> Nuovo evento</div>' +
            '<div><kbd>S</kbd> Salva evento</div>' +
            '<div><kbd>E</kbd> Esporta</div>' +
            '<div><kbd>I</kbd> Importa</div>' +
            '<div><kbd>Esc</kbd> Chiudi modale</div>' +
            '<div><kbd>+</kbd>/<kbd>-</kbd> Zoom</div>' +
            '<div><kbd>F</kbd> Cerca</div>' +
            '<div><kbd>G</kbd> Vai all\'anno</div>' +
            '<div><kbd>Ctrl+Z</kbd> Annulla</div>' +
            '<div><kbd>Ctrl+Shift+Z</kbd> Ripeti</div>' +
            '<div><kbd>?</kbd> Mostra/nascondi aiuto</div>';
        document.body.appendChild(hint);
        // Click-outside to close
        hint.addEventListener('click', function (e) { e.stopPropagation(); });
        document.addEventListener('click', function (e) {
            if (hint.classList.contains('open') && !hint.contains(e.target)) {
                hint.classList.remove('open');
            }
        });
        // Escape to close
        hint.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { hint.classList.remove('open'); }
        });
    }
    hint.classList.toggle('open');
}
