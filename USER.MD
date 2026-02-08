# Klue: User Guide & Documentation

Klue is a local-first knowledge management tool for Chrome. It allows you to capture, organize, and interact with information from across the web without compromising your privacy. Every component—from the database to the AI search engine—runs entirely within your browser.

---

## 1. Getting Started

### Installation
1. Download the `chrome-clipper` directory to your local machine.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `chrome-clipper` folder.
5. (Recommended) Pin Klue to your extensions toolbar for quick access.

### The First Run
The first time you open Klue, it will download a small (~25MB) machine learning model (`all-MiniLM-L6-v2`). This model stays in your browser cache and is used to power semantic search. This process typically takes 5–10 seconds depending on your connection.

---

## 2. Core Workflows: Capturing Knowledge

Klue is designed to capture information with minimal friction.

### Method A: Context Menu (Recommended)
1. Highlight any text on a webpage.
2. Right-click and select **"Capture Text"**.
3. The side panel will open automatically with your selection pre-filled.

### Method B: Keyboard Shortcut
1. Highlight text.
2. Press `Cmd+Shift+Y` (Mac) or `Ctrl+Shift+Y` (Windows).

### Method C: Manual Capture
1. Click the Klue icon in your toolbar.
2. Type or paste content directly into the capture area.

### Enriching Your Clips
When capturing, you can add:
*   **User Notes**: Your own thoughts or summaries.
*   **Tags**: Use the `#` symbol or press enter to create tags for easy grouping.
*   **Images**: Klue can store multiple images per note.
*   **Automatic Metadata**: Klue automatically records the source URL, page title, site name, and favicon.

---

## 3. Organizing and Managing

### The Library View
Click the Klue icon without selecting text to view your library.
*   **Search**: Use the top search bar for hybrid results (see Section 4).
*   **Filtering**: Filter your library by clicking on tags, the **Starred** icon, or the **Read Later** queue.
*   **Sorting**: Toggle between "Newest" and "Oldest" views.

### Triage: Starred vs. Read Later
*   **Read Later**: Use this for content you’ve clipped but haven't processed yet. It acts as an "Inbox."
*   **Starred**: Use this for high-value information you refer to frequently.

---

## 4. Retrieval: Semantic Search and AI

Klue uses a **Local RAG (Retrieval-Augmented Generation)** stack to find information based on meaning, not just keywords.

### Hybrid Search
When you type in the search bar:
1.  **Keyword Search**: Finds exact matches in text and tags.
2.  **Semantic Search**: Finds related concepts. For example, searching for "budgeting" might surface a note about "financial planning" even if the word "budgeting" isn't present.

### Contextual Recall
When you visit a website where you have previously saved notes, a **Context Pill** will appear at the top of the side panel. 
*   **Exact Matches**: Shows notes from the specific URL you are viewing.
*   **Domain Matches**: Shows notes from the same website.
*   **Semantic Matches**: Shows notes from *anywhere* in your library that are conceptually related to what you are currently reading.

### AI Assistant (Chat)
Switch to the **Chat** tab to interact with your library.
*   **Ask Questions**: "What did I save last week about React hooks?"
*   **Synthesize**: "Based on my notes on climate change, what are the three main takeaways?"
*   **Contextual Assistance**: Ask about the page you are currently viewing to see how it relates to your existing knowledge.

---

## 5. Use Cases

### Academic & Market Research
Capture snippets from PDFs and articles. Use semantic search to connect different sources that use different terminology but discuss the same core concepts.

### Developer Documentation
Clip code snippets and technical explanations. Klue’s "Smart Chips" automatically identify GitHub repos and YouTube tutorials, providing a cleaner view of your technical resources.

### Content Curation
Social media managers can clip X (Twitter) threads and YouTube videos. Klue identifies these platforms and applies specific styling to help you quickly identify media types in your library.

---

## 6. Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **Side panel won't open** | Ensure you are using the latest version of Chrome. Some sites (like the Chrome Web Store) restrict extension scripts for security. |
| **Search isn't finding new notes** | The vector index may still be processing. For large captures, wait a few seconds. You can force a refresh by running `window.reindexAllNotes()` in the console. |
| **Search results seem irrelevant** | Check if you have active filters (like a specific tag) that are narrowing your results. |
| **Images not loading** | Images are stored as local blobs. If you cleared your browser data/IndexedDB, these may be lost. |

---

## 7. Benefits: Why Klue?

*   **Zero Latency**: Because everything is local, there is no round-trip to a server. Searching 1,000+ notes takes milliseconds.
*   **Absolute Privacy**: Your research is yours. No one—not even the developers—can see what you clip or what you ask the AI.
*   **Offline Access**: Your entire knowledge base is available even without an internet connection (once the initial ML model is downloaded).
*   **No Subscription**: Klue utilizes your browser's existing resources to provide AI features that usually require a monthly fee.
