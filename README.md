# Klue - Chrome Extension

A Chrome extension that lets you capture text from web pages with notes and tags using a clean side panel interface.

## Features

- 📝 **Capture Text** - Highlight text and save it with context
- 🏷️ **Tags & Notes** - Add your thoughts and organize with tags
- 🔍 **Search & Filter** - Find your clips quickly
- 📱 **Side Panel UI** - Never blocks website content
- 💾 **Local Storage** - All data saved locally in your browser

## Installation (Development)

### 1. Load the Extension

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `chrome-clipper` directory
5. The extension is now installed!

### 2. Start Hot Reload (Optional but Recommended)

For easier development, run the file watcher in a terminal:

```bash
cd chrome-clipper
python3 dev-watch.py
```

This will watch for file changes and notify you when to reload the extension. Keep the `chrome://extensions` page open in a pinned tab for quick reloading.

## Usage

### Capturing Text

**Method 1: Context Menu (Recommended)**
1. Highlight text on any webpage
2. Right-click and select "Capture Text"
3. The side panel opens with the text
4. Add your notes and tags
5. Press `Cmd+Enter` or click "Save Clip"

**Method 2: Extension Icon**
1. Highlight text on any webpage
2. Click the extension icon in the toolbar
3. Follow the same steps as above

**Method 3: Keyboard Shortcut**
1. Highlight text on any webpage
2. Press `Cmd+Shift+Y` (Mac) or `Ctrl+Shift+Y` (Windows/Linux)
3. Follow the same steps as above

### Viewing Your Library

1. Click the extension icon without selecting text
2. Browse your saved clips
3. Use search to find specific clips
4. Click on tag pills to filter by tag
5. Click on a card to expand and see full text
6. Click the "Context" pill (when available) to automatically filter and expand notes related to the current page
7. Click the 🗑️ icon to delete a clip

## Development

### Project Structure

```
chrome-clipper/
├── manifest.json         # Extension configuration (Manifest V3)
├── background.js         # Service worker (context menu, capture logic)
├── panel.html           # Side panel UI structure
├── panel.css            # Side panel styles
├── panel.js             # Side panel logic (router, rendering)
├── icons/               # Extension icons (16, 32, 48, 128px)
├── dev-watch.py         # Hot reload file watcher
└── create-icons.py      # Icon generator script
```

### Tech Stack

- **Manifest V3** - Latest Chrome extension standard
- **Vanilla JavaScript** - No frameworks, just ES6+
- **Chrome APIs**: `sidePanel`, `contextMenus`, `storage`, `scripting`
- **CSS Variables** - Easy theming
- **System Fonts** - Native look and feel

### Key Technical Decisions

1. **Side Panel API** - Chosen over floating tooltips for reliability (no z-index/overflow issues)
2. **Service Worker** - Required by Manifest V3 for background tasks
3. **Local Storage** - Using `chrome.storage.local` for persistence
4. **No Build Step** - Direct HTML/CSS/JS files for simplicity

### Storage Schema

**Transient Data** (for capture flow):
```javascript
{
  pendingClipData: {
    text: "Selected text...",
    url: "https://example.com",
    metadata: {
      title: "Page Title",
      siteName: "Site Name",
      author: "Author Name",
      favicon: "https://..."
    },
    timestamp: 1234567890
  }
}
```

**Persistent Data** (library):
```javascript
{
  savedNotes: [
    {
      id: "uuid",
      text: "Captured text...",
      userNote: "My thoughts...",
      tags: ["#research", "#ideas"],
      url: "https://example.com",
      metadata: { ... },
      timestamp: 1234567890
    }
  ]
}
```

### Testing Checklist

- [ ] Test on multiple websites (Google, Medium, Wikipedia, GitHub)
- [ ] Test with very long text selections (1000+ words)
- [ ] Test with special characters in notes/tags
- [ ] Test with empty tags field
- [ ] Test deleting last note (should show empty state)
- [ ] Test search with no matches
- [ ] Test in multiple tabs simultaneously
- [ ] Test keyboard shortcuts
- [ ] Test without internet connection (should still work)

## Debugging

### View Console Logs

**Background Service Worker:**
1. Go to `chrome://extensions`
2. Find "Klue"
3. Click "service worker" link under "Inspect views"

**Side Panel:**
1. Open the side panel
2. Right-click anywhere in the panel
3. Select "Inspect"

**Webpage Context:**
1. Open DevTools on any webpage (F12)
2. Check Console for any errors

### Common Issues

**Extension won't load:**
- Check that all files are present
- Validate `manifest.json` syntax
- Check for JavaScript errors in service worker console

**Context menu not appearing:**
- Make sure text is selected
- Check background service worker console for errors
- Try reloading the extension

**Side panel won't open:**
- Check that you're using Chrome (not Chromium or other browsers)
- Verify `sidePanel` permission in manifest
- Check background service worker for errors

**Data not persisting:**
- Check `chrome.storage.local` in DevTools (Application tab)
- Verify storage permissions in manifest
- Check for storage quota errors in console

## Roadmap

### Current Version: 1.0 (MVP)
- ✅ Text capture with metadata
- ✅ Notes and tags
- ✅ Search and filter
- ✅ Delete functionality
- ✅ Side panel UI

### Future Enhancements
- [ ] Edit saved clips
- [ ] Export to JSON/Markdown
- [ ] Import from other tools
- [ ] Text highlighting with fragments
- [ ] Folders/categories
- [ ] Cloud sync (optional)
- [ ] Dark mode
- [ ] Keyboard navigation

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
