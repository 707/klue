// Background Service Worker for Knowledge Clipper
// Handles context menu, text capture, and side panel orchestration

console.log('🚀 Knowledge Clipper background service worker started');

// Create context menu on installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log('📦 Extension installed, creating context menu...');

  // Create context menu item for capturing text
  chrome.contextMenus.create({
    id: 'capture-text',
    title: 'Capture Text',
    contexts: ['selection']
  });

  console.log('✅ Context menu created');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('📋 Context menu clicked:', info.menuItemId);

  if (info.menuItemId === 'capture-text') {
    console.log('🎯 Capture text triggered');
    console.log('Selected text:', info.selectionText);
    console.log('Page URL:', info.pageUrl);

    try {
      // IMPORTANT: Open panel FIRST while we still have user gesture context
      await chrome.sidePanel.open({ windowId: tab.windowId });
      console.log('📂 Side panel opened');

      // Now do async work (panel will show loading state initially)
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractPageMetadata,
        args: [info.selectionText]
      });

      const metadata = results[0].result;
      console.log('📊 Extracted metadata:', metadata);

      // Prepare the clip data
      const clipData = {
        text: info.selectionText,
        url: info.pageUrl,
        metadata: metadata,
        timestamp: Date.now()
      };

      // Save to storage as pending clip
      await chrome.storage.local.set({ pendingClipData: clipData });
      console.log('💾 Saved to storage as pendingClipData');

    } catch (error) {
      console.error('❌ Error capturing text:', error);
    }
  }
});

// Handle extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  console.log('🔘 Extension icon clicked');

  try {
    // IMPORTANT: Open panel FIRST while we still have user gesture context
    await chrome.sidePanel.open({ windowId: tab.windowId });
    console.log('📂 Side panel opened');

    // Now check if there's a selection and capture it
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString()
    });

    const selectedText = results[0].result;

    if (selectedText && selectedText.trim()) {
      // Has selection - capture it
      console.log('📝 Has selection, capturing...');

      const metadataResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractPageMetadata,
        args: [selectedText]
      });

      const metadata = metadataResults[0].result;

      const clipData = {
        text: selectedText,
        url: tab.url,
        metadata: metadata,
        timestamp: Date.now()
      };

      await chrome.storage.local.set({ pendingClipData: clipData });
      console.log('💾 Saved to storage');
    } else {
      console.log('📚 No selection, opening library');
      // No selection - just open library
      // Clear any pending data to ensure library mode
      await chrome.storage.local.remove('pendingClipData');
    }

  } catch (error) {
    console.error('❌ Error handling icon click:', error);
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'capture-text') {
    console.log('⌨️  Keyboard shortcut triggered');

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
      // Trigger the same flow as icon click
      chrome.action.onClicked.dispatch(tab);
    }
  }
});

// Listen for messages from the side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Message received:', message);

  if (message.action === 'close_panel') {
    // Fallback method to close panel if window.close() doesn't work
    console.log('🚪 Close panel requested');
    // Note: In Manifest V3, we can't force close the side panel programmatically
    // The panel.js should use window.close() which works in most cases
    sendResponse({ success: true });
  }

  if (message.action === 'log') {
    // Useful for debugging from panel
    console.log('📝 Panel log:', message.data);
    sendResponse({ success: true });
  }

  return true; // Keep message channel open for async response
});

/**
 * Injected function to extract page metadata
 * This runs in the context of the webpage
 */
function extractPageMetadata(selectedText) {
  // Extract metadata from the page
  const metadata = {
    title: document.title || 'Untitled',
    author: null,
    siteName: null,
    favicon: null
  };

  // Try to get author from meta tags
  const authorMeta = document.querySelector('meta[name="author"]') ||
                     document.querySelector('meta[property="article:author"]');
  if (authorMeta) {
    metadata.author = authorMeta.content;
  }

  // Try to get site name from Open Graph
  const siteNameMeta = document.querySelector('meta[property="og:site_name"]');
  if (siteNameMeta) {
    metadata.siteName = siteNameMeta.content;
  } else {
    // Fallback: use hostname
    metadata.siteName = window.location.hostname.replace('www.', '');
  }

  // Get favicon
  const faviconLink = document.querySelector('link[rel="icon"]') ||
                      document.querySelector('link[rel="shortcut icon"]');
  if (faviconLink) {
    metadata.favicon = new URL(faviconLink.href, window.location.href).href;
  } else {
    // Fallback to Google's favicon service
    const domain = window.location.hostname;
    metadata.favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  }

  return metadata;
}
