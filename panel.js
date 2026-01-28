// Knowledge Clipper - Side Panel Logic
console.log('📱 Panel script loaded');

// State
let currentMode = null;
let allNotes = [];
let filteredNotes = [];

// Unified filter state
let filterState = {
  search: '',
  sort: 'newest',
  tags: []
};

// Load persisted filter state
async function loadFilterState() {
  try {
    const metadata = await window.database.db.metadata.get('filterState');
    if (metadata && metadata.value) {
      filterState = metadata.value;
      console.log('📂 Loaded persisted filter state:', filterState);
    }
  } catch (error) {
    console.error('❌ Error loading filter state:', error);
  }
}

// Save filter state
async function saveFilterState() {
  try {
    await window.database.db.metadata.put({ key: 'filterState', value: filterState });
  } catch (error) {
    console.error('❌ Error saving filter state:', error);
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎯 Initializing panel...');

  try {
    // Run data migration (if needed)
    await window.database.migrateFromChromeStorage();

    // Load persisted filter state
    await loadFilterState();

    // Check for pending clip data from chrome.storage.local
    const { pendingClipData } = await chrome.storage.local.get('pendingClipData');

    if (pendingClipData) {
      console.log('📋 Found pending clip data, rendering Capture Mode');
      renderCaptureMode(pendingClipData);
    } else {
      console.log('⏳ No pending data yet, waiting for it or showing library...');

      // Set up listener for when pendingClipData arrives
      let timeoutId = setTimeout(() => {
        console.log('📚 No clip data received, showing Library Mode');
        renderLibraryMode();
      }, 500); // Wait 500ms for data to arrive

      // Listen for storage changes
      const listener = (changes, area) => {
        if (area === 'local' && changes.pendingClipData && changes.pendingClipData.newValue) {
          console.log('📋 Pending clip data arrived, rendering Capture Mode');
          clearTimeout(timeoutId);
          chrome.storage.onChanged.removeListener(listener);
          renderCaptureMode(changes.pendingClipData.newValue);
        }
      };

      chrome.storage.onChanged.addListener(listener);
    }
  } catch (error) {
    console.error('❌ Error initializing panel:', error);
  }
});

/**
 * Capture Mode
 */
function renderCaptureMode(clipData) {
  currentMode = 'capture';

  // Hide loading and library, show capture
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('library-mode').classList.add('hidden');
  document.getElementById('capture-mode').classList.remove('hidden');

  // Show back button
  const backButton = document.getElementById('back-button');
  backButton.classList.remove('hidden');
  backButton.onclick = navigateToLibrary;

  // Populate source bar
  document.getElementById('capture-favicon').src = clipData.metadata.favicon;
  document.getElementById('capture-site-name').textContent = clipData.metadata.siteName;
  document.getElementById('capture-url').textContent = clipData.url;

  // Populate text preview
  document.getElementById('capture-text-preview').textContent = clipData.text;

  // Auto-focus notes textarea
  const notesInput = document.getElementById('capture-notes');
  notesInput.focus();

  // Setup keyboard shortcut (Cmd+Enter to save)
  notesInput.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('save-button').click();
    }
  });

  // Setup save button
  const saveButton = document.getElementById('save-button');
  saveButton.addEventListener('click', () => handleSaveClip(clipData));
}

async function handleSaveClip(clipData) {
  console.log('💾 Saving clip...');

  const saveButton = document.getElementById('save-button');
  const notesInput = document.getElementById('capture-notes');
  const tagsInput = document.getElementById('capture-tags');

  // Disable button to prevent double-click
  saveButton.disabled = true;

  try {
    // Get user input
    const userNote = notesInput.value.trim();
    const tagsString = tagsInput.value.trim();
    const tags = tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`);

    // Create note object
    const note = {
      id: crypto.randomUUID(),
      text: clipData.text,
      userNote: userNote,
      tags: tags,
      url: clipData.url,
      metadata: clipData.metadata,
      timestamp: Date.now()
    };

    // Save note to IndexedDB
    await window.database.addNote(note);

    // Remove pending clip data from chrome.storage
    await chrome.storage.local.remove('pendingClipData');

    console.log('✅ Clip saved successfully:', note);

    // Show success feedback
    saveButton.classList.add('success');
    saveButton.querySelector('.button-text').textContent = 'Saved!';
    const iconEl = saveButton.querySelector('.button-icon use');
    if (iconEl) {
      iconEl.setAttribute('href', '#icon-check');
    }

    // Auto-close after delay
    setTimeout(() => {
      console.log('🚪 Auto-closing panel...');
      window.close();
    }, 800);

  } catch (error) {
    console.error('❌ Error saving clip:', error);
    saveButton.disabled = false;
    alert('Failed to save clip. Please try again.');
  }
}

/**
 * Navigation
 */
async function navigateToLibrary() {
  console.log('⬅️ Navigating back to library...');

  // Clear pending clip data from chrome.storage
  await chrome.storage.local.remove('pendingClipData');

  // Render library mode
  await renderLibraryMode();
}

/**
 * Library Mode
 */
async function renderLibraryMode() {
  currentMode = 'library';

  // Hide loading and capture, show library
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('capture-mode').classList.add('hidden');
  document.getElementById('library-mode').classList.remove('hidden');

  // Hide back button in library mode
  document.getElementById('back-button').classList.add('hidden');

  // Load notes from IndexedDB
  allNotes = await window.database.getAllNotes();
  filteredNotes = [...allNotes];

  console.log(`📚 Loaded ${allNotes.length} notes`);

  // Setup event listeners
  setupLibraryEventListeners();

  // Render notes
  renderNotesList();

  // Populate filter dropdown
  populateFilterDropdown();

  // Render active filters
  renderActiveFilters();

  // Update placeholder based on current filter state
  updatePlaceholder();
}

function setupLibraryEventListeners() {
  const filterInput = document.getElementById('filter-input');
  const filterDropdown = document.getElementById('filter-dropdown');
  const clearAllButton = document.getElementById('clear-all-filters');

  // Filter input focus/blur
  filterInput.addEventListener('focus', () => {
    filterDropdown.classList.remove('hidden');
    filterInput.setAttribute('aria-expanded', 'true');
  });

  filterInput.addEventListener('blur', (e) => {
    // Delay to allow clicking on dropdown items
    setTimeout(() => {
      filterDropdown.classList.add('hidden');
      filterInput.setAttribute('aria-expanded', 'false');
    }, 200);
  });

  // Filter input typing (search)
  let searchTimeout;
  filterInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);

    // Show loading indicator
    const loadingDots = document.getElementById('search-loading');
    if (loadingDots) loadingDots.classList.remove('hidden');

    searchTimeout = setTimeout(() => {
      filterState.search = e.target.value.trim().toLowerCase();
      filterAndRenderNotes();
      saveFilterState();

      // Hide loading indicator
      if (loadingDots) loadingDots.classList.add('hidden');
    }, 200); // Debounce 200ms (reduced from 300ms)
  });

  // Filter dropdown options click
  filterDropdown.addEventListener('click', (e) => {
    const option = e.target.closest('.filter-option');
    if (!option) return;

    const type = option.dataset.type;
    const value = option.dataset.value;

    if (type === 'sort') {
      filterState.sort = value;
    } else if (type === 'tag') {
      if (filterState.tags.includes(value)) {
        // Remove tag
        filterState.tags = filterState.tags.filter(t => t !== value);
      } else {
        // Add tag
        filterState.tags.push(value);
      }
    }

    filterAndRenderNotes();
    renderActiveFilters();
    saveFilterState();
  });

  // Keyboard navigation in dropdown
  filterDropdown.addEventListener('keydown', (e) => {
    const options = Array.from(filterDropdown.querySelectorAll('.filter-option'));
    const currentIndex = options.indexOf(document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % options.length;
      options[nextIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex === 0 ? options.length - 1 : currentIndex - 1;
      options[prevIndex].focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (document.activeElement.classList.contains('filter-option')) {
        document.activeElement.click();
      }
    }
  });

  // Clear All Filters button
  clearAllButton.addEventListener('click', () => {
    filterState.search = '';
    filterState.sort = 'newest';
    filterState.tags = [];
    filterInput.value = '';
    filterAndRenderNotes();
    renderActiveFilters();
    saveFilterState();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Cmd+F / Ctrl+F to focus filter input (Library mode only)
    if ((e.metaKey || e.ctrlKey) && e.key === 'f' && currentMode === 'library') {
      e.preventDefault();
      filterInput.focus();
    }

    // Escape key handling
    if (e.key === 'Escape') {
      if (!filterDropdown.classList.contains('hidden')) {
        // Close dropdown if open
        filterDropdown.classList.add('hidden');
        filterInput.setAttribute('aria-expanded', 'false');
      } else if (filterInput.value) {
        // Clear input if dropdown is closed but has text
        filterInput.value = '';
        filterState.search = '';
        filterAndRenderNotes();
        renderActiveFilters();
        saveFilterState();
      }
    }
  });
}

function populateFilterDropdown() {
  // Populate tags in dropdown
  const tagsListEl = document.getElementById('filter-tags-list');
  tagsListEl.innerHTML = '';

  // Extract unique tags
  const uniqueTags = new Set();
  allNotes.forEach(note => {
    note.tags.forEach(tag => uniqueTags.add(tag));
  });

  if (uniqueTags.size === 0) {
    // Hide tags section if no tags
    document.getElementById('tags-filter-section').style.display = 'none';
  } else {
    document.getElementById('tags-filter-section').style.display = 'block';
    uniqueTags.forEach(tag => {
      const option = document.createElement('div');
      option.className = 'filter-option';
      option.dataset.type = 'tag';
      option.dataset.value = tag;
      option.setAttribute('role', 'menuitem');
      option.setAttribute('tabindex', '0');
      option.innerHTML = `<span class="filter-option-icon">#</span>${tag.replace('#', '')}`;
      tagsListEl.appendChild(option);
    });
  }
}

function filterAndRenderNotes() {
  // Start with all notes
  filteredNotes = [...allNotes];

  // Apply search filter
  if (filterState.search) {
    filteredNotes = filteredNotes.filter(note => {
      const searchableText = [
        note.text,
        note.userNote,
        note.metadata.siteName,
        note.metadata.title
      ].join(' ').toLowerCase();

      return searchableText.includes(filterState.search);
    });
  }

  // Apply tag filters
  if (filterState.tags.length > 0) {
    filteredNotes = filteredNotes.filter(note =>
      filterState.tags.some(tag => note.tags.includes(tag))
    );
  }

  // Apply sort
  if (filterState.sort === 'newest') {
    filteredNotes.sort((a, b) => b.timestamp - a.timestamp);
  } else if (filterState.sort === 'oldest') {
    filteredNotes.sort((a, b) => a.timestamp - b.timestamp);
  }

  // Update ARIA live region for screen readers
  const filterStatus = document.getElementById('filter-status');
  if (filterStatus) {
    const activeFiltersCount = (filterState.sort !== 'newest' ? 1 : 0) + filterState.tags.length;
    filterStatus.textContent = `Showing ${filteredNotes.length} of ${allNotes.length} clips${activeFiltersCount > 0 ? ` with ${activeFiltersCount} filter${activeFiltersCount === 1 ? '' : 's'} active` : ''}`;
  }

  // Update search input placeholder
  updatePlaceholder();

  renderNotesList();
}

function renderActiveFilters() {
  const activeFiltersEl = document.getElementById('active-filters');
  const chipsContainer = document.getElementById('active-filters-chips');
  chipsContainer.innerHTML = '';

  let hasActiveFilters = false;

  // Add sort chip (only if not default)
  if (filterState.sort !== 'newest') {
    hasActiveFilters = true;
    const chip = createFilterChip('sort', filterState.sort, filterState.sort === 'newest' ? '↓ Newest' : '↑ Oldest');
    chipsContainer.appendChild(chip);
  }

  // Add tag chips
  filterState.tags.forEach(tag => {
    hasActiveFilters = true;
    const chip = createFilterChip('tag', tag, tag);
    chipsContainer.appendChild(chip);
  });

  // Show/hide active filters section
  if (hasActiveFilters) {
    activeFiltersEl.classList.remove('hidden');
  } else {
    activeFiltersEl.classList.add('hidden');
  }
}

function updatePlaceholder() {
  const filterInput = document.getElementById('filter-input');
  if (!filterInput) return;

  const activeFiltersCount = (filterState.sort !== 'newest' ? 1 : 0) + filterState.tags.length;

  if (activeFiltersCount > 0) {
    filterInput.placeholder = `Search, filter, or sort... (${activeFiltersCount} filter${activeFiltersCount === 1 ? '' : 's'} active)`;
  } else {
    filterInput.placeholder = 'Search, filter, or sort...';
  }
}

function createFilterChip(type, value, label) {
  const chip = document.createElement('div');
  chip.className = 'filter-chip';
  chip.innerHTML = `
    <span>${label}</span>
    <span class="filter-chip-remove">×</span>
  `;

  chip.querySelector('.filter-chip-remove').addEventListener('click', (e) => {
    // Add removing animation
    chip.classList.add('removing');

    // Wait for animation to finish before removing
    setTimeout(() => {
      if (type === 'sort') {
        filterState.sort = 'newest'; // Reset to default
      } else if (type === 'tag') {
        filterState.tags = filterState.tags.filter(t => t !== value);
      }
      filterAndRenderNotes();
      renderActiveFilters();
      saveFilterState();
    }, 150);
  });

  return chip;
}

function renderNotesList() {
  const notesListEl = document.getElementById('notes-list');
  const emptyStateEl = document.getElementById('empty-state');
  const searchEmptyStateEl = document.getElementById('search-empty-state');

  // Clear existing notes (but keep empty states)
  const existingCards = notesListEl.querySelectorAll('.note-card');
  existingCards.forEach(card => card.remove());

  // Handle empty states
  if (allNotes.length === 0) {
    // No notes at all
    emptyStateEl.classList.remove('hidden');
    searchEmptyStateEl.classList.add('hidden');
    return;
  }

  if (filteredNotes.length === 0) {
    // Has notes but search/filter returned nothing
    emptyStateEl.classList.add('hidden');
    searchEmptyStateEl.classList.remove('hidden');
    document.getElementById('search-empty-query').textContent =
      filterState.search ? `No results for "${filterState.search}"` : 'No notes match your filters';
    return;
  }

  // Has notes to display
  emptyStateEl.classList.add('hidden');
  searchEmptyStateEl.classList.add('hidden');

  // Render each note
  filteredNotes.forEach(note => {
    const noteCard = createNoteCard(note);
    notesListEl.appendChild(noteCard);
  });

  console.log(`📝 Rendered ${filteredNotes.length} notes`);
}

function createNoteCard(note) {
  const template = document.getElementById('note-card-template');
  const card = template.content.cloneNode(true).querySelector('.note-card');

  // Set note ID
  card.dataset.noteId = note.id;

  // Add fade-in animation
  card.classList.add('fade-in');

  // Make card keyboard accessible
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'article');
  card.setAttribute('aria-label', `Clip from ${note.metadata.siteName}`);

  // Populate source info
  card.querySelector('.note-favicon').src = note.metadata.favicon;
  card.querySelector('.note-site-name').textContent = note.metadata.siteName;
  card.querySelector('.note-date').textContent = formatDate(note.timestamp);

  // Populate text preview
  card.querySelector('.note-text-preview').textContent = note.text;

  // Populate user note (if exists)
  if (note.userNote) {
    card.querySelector('.note-user-note').textContent = note.userNote;
  } else {
    card.querySelector('.note-user-note').style.display = 'none';
  }

  // Populate tags
  const tagsContainer = card.querySelector('.note-tags');
  if (note.tags.length > 0) {
    note.tags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'note-tag';
      tagEl.textContent = tag;
      tagsContainer.appendChild(tagEl);
    });
  } else {
    tagsContainer.style.display = 'none';
  }

  // Populate expanded content
  card.querySelector('.note-text-full').textContent = note.text;
  card.querySelector('.note-link').href = note.url;

  // Toggle expand/collapse on click (except delete button)
  card.addEventListener('click', (e) => {
    if (!e.target.closest('.delete-button')) {
      card.classList.toggle('expanded');
      card.setAttribute('aria-expanded', card.classList.contains('expanded'));
    }
  });

  // Keyboard interaction for note card
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.classList.toggle('expanded');
      card.setAttribute('aria-expanded', card.classList.contains('expanded'));
    }
  });

  // Delete button
  const deleteButton = card.querySelector('.delete-button');
  deleteButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    await handleDeleteNote(note.id);
  });

  return card;
}

async function handleDeleteNote(noteId) {
  if (!confirm('Delete this clip?')) {
    return;
  }

  console.log('🗑️  Deleting note:', noteId);

  try {
    // Delete from IndexedDB
    await window.database.deleteNote(noteId);

    // Remove from local array
    allNotes = allNotes.filter(note => note.id !== noteId);

    console.log('✅ Note deleted');

    // Re-render
    filterAndRenderNotes();
    populateFilterDropdown();

  } catch (error) {
    console.error('❌ Error deleting note:', error);
    alert('Failed to delete clip. Please try again.');
  }
}

/**
 * Utilities
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}
