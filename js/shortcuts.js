// ================================================================
//  KEYBOARD SHORTCUTS
// ================================================================
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function (e) {
        // Don't trigger shortcuts when typing in inputs/textareas
        const tag = (e.target.tagName || '').toLowerCase();
        const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
        // Allow Escape even in inputs: clear search, then blur
        if (e.key === 'Escape' && isInput) {
            e.preventDefault();
            if (typeof clearSearch === 'function') clearSearch();
            e.target.blur();
            return;
        }
        if (isInput) return;

        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;

        // Enter cycles through searchResults (works with both search text and category pills)
        if (e.key === 'Enter' && searchResults.length > 0) {
            e.preventDefault();
            currentSearchIndex = (currentSearchIndex + 1) % searchResults.length;
            document.getElementById('searchCounter').textContent = (currentSearchIndex + 1) + '/' + searchResults.length;
            updateSearchNavButtons();
            applySearchGlow(searchResults[currentSearchIndex]);
            scrollToYear(searchResults[currentSearchIndex].startYear);
            return;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            // Close quick create first if visible
            if (typeof hideQuickCreate === 'function' && isQuickCreateVisible()) {
                hideQuickCreate();
                return;
            }
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
            if (document.getElementById('segmentsModal').classList.contains('open')) { closeSegmentsModal(false); return; }
            if (document.getElementById('timelineModal').classList.contains('open')) { closeTimelineModal(); return; }
            if (document.getElementById('importChoiceModal').classList.contains('open')) { closeImportChoiceModal(); return; }
            if (document.getElementById('settingsModal').classList.contains('open')) { closeSettingsModal(); return; }
            // Clear search text if present
            if (document.getElementById('searchInput').value.trim()) {
                clearSearch();
                return;
            }
            // Deselect category pills if any active
            if (activeCategoryFilters.length > 0) {
                activeCategoryFilters = [];
                if (highlightedCategoryId) { unhighlightCategoryConnector(highlightedCategoryId); }
                renderPills();
                renderEvents();
                searchEvents();
                return;
            }
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
        hint.setAttribute('aria-label', t('shortcuts_dialog_title'));
        hint.setAttribute('aria-modal', 'true');
        hint.innerHTML =
            '<button class="shortcuts-hint-close" onclick="document.getElementById(\'shortcutsHint\').classList.remove(\'open\')" aria-label="' + t('close_aria') + '">×</button>' +
            '<h3 data-i18n="shortcuts_dialog_title">' + t('shortcuts_dialog_title') + '</h3>' +
            '<div><kbd>N</kbd> <span>' + t('shortcut_new_event') + '</span></div>' +
            '<div><kbd>S</kbd> <span>' + t('shortcut_save_event') + '</span></div>' +
            '<div><kbd>E</kbd> <span>' + t('shortcut_export') + '</span></div>' +
            '<div><kbd>I</kbd> <span>' + t('shortcut_import') + '</span></div>' +
            '<div><kbd>Esc</kbd> <span>' + t('shortcut_close_modal') + '</span></div>' +
            '<div><kbd>+</kbd>/<kbd>-</kbd> <span>' + t('shortcut_zoom') + '</span></div>' +
            '<div><kbd>F</kbd> <span>' + t('shortcut_search_focus') + '</span></div>' +
            '<div><kbd>G</kbd> <span>' + t('shortcut_go_to_year') + '</span></div>' +
            '<div><kbd>Ctrl+Z</kbd> <span>' + t('shortcut_undo') + '</span></div>' +
            '<div><kbd>Ctrl+Shift+Z</kbd> <span>' + t('shortcut_redo') + '</span></div>' +
            '<div><kbd>?</kbd> <span>' + t('shortcut_help') + '</span></div>';
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