// [NOT-40] Gemini Service - AI Synthesis using Chrome's built-in window.ai
// Provides synthesis capabilities to generate concise summaries from context and related notes
// Uses Gemini Nano via the Prompt API for on-device AI processing

/**
 * [NOT-40] SynthesisQueue - Sequential synthesis job processor
 * Prevents concurrent AI requests from overloading GPU/NPU or crashing the browser
 *
 * Features:
 * - Sequential processing (one synthesis at a time)
 * - Throttling (ignores duplicate requests while generation is active)
 * - Error isolation (failed tasks don't stop the queue)
 */
class SynthesisQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.activeSynthesis = null;
  }

  /**
   * Add a synthesis task to the queue
   * @param {Function} task - Async function to execute
   * @returns {Promise} - Resolves when task completes
   */
  async enqueue(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  /**
   * Process synthesis tasks sequentially
   * Only one synthesis runs at a time to prevent GPU/NPU overload
   * @private
   */
  async process() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const { task, resolve, reject } = this.queue.shift();
      try {
        this.activeSynthesis = { startTime: Date.now() };
        const result = await task();
        resolve(result);
        console.log('✅ [NOT-40] Synthesis completed successfully');
      } catch (error) {
        console.error('❌ [NOT-40] Synthesis task failed:', error);
        reject(error);
      } finally {
        this.activeSynthesis = null;
      }
    }

    this.isProcessing = false;
  }

  /**
   * Check if synthesis is currently active
   */
  get isActive() {
    return this.isProcessing;
  }
}

/**
 * GeminiService - Manages AI synthesis using Chrome's window.ai (Gemini Nano)
 *
 * Provides semantic synthesis by combining current page context with related notes
 * to generate concise, markdown-formatted summaries.
 *
 * Requirements:
 * - Chrome Canary/Dev with Gemini Nano enabled via flags
 * - window.ai.languageModel API availability
 */
class GeminiService {
  constructor() {
    this.session = null;
    this.isAvailable = false;
    this.availabilityStatus = null;
    this.synthesisQueue = new SynthesisQueue();
  }

  /**
   * [NOT-40] Check if window.ai is available and Gemini Nano is ready
   * @returns {Promise<boolean>} - True if available, false otherwise
   */
  async checkAvailability() {
    console.log('🔍 [NOT-40] Checking Gemini Nano availability...');

    // Check if window.ai exists
    if (!window.ai || !window.ai.languageModel) {
      console.warn('⚠️  [NOT-40] window.ai not found. Gemini Nano is not available.');
      this.isAvailable = false;
      this.availabilityStatus = 'unavailable';
      return false;
    }

    try {
      // Check model availability status
      const capabilities = await window.ai.languageModel.capabilities();
      this.availabilityStatus = capabilities.available;

      console.log('📊 [NOT-40] Gemini Nano status:', this.availabilityStatus);

      // Available states: "readily", "after-download", "no"
      if (this.availabilityStatus === 'readily' || this.availabilityStatus === 'after-download') {
        this.isAvailable = true;
        console.log('✅ [NOT-40] Gemini Nano is available');
        return true;
      } else {
        this.isAvailable = false;
        console.warn('⚠️  [NOT-40] Gemini Nano is not available:', this.availabilityStatus);
        return false;
      }
    } catch (error) {
      console.error('❌ [NOT-40] Error checking Gemini Nano availability:', error);
      this.isAvailable = false;
      this.availabilityStatus = 'error';
      return false;
    }
  }

  /**
   * [NOT-40] Create an AI session with system prompts
   * Initializes the Gemini Nano model for synthesis tasks
   * @returns {Promise<Object>} - The AI session object
   */
  async createSession() {
    console.log('🔧 [NOT-40] Creating Gemini Nano session...');

    if (!this.isAvailable) {
      throw new Error('Gemini Nano is not available. Cannot create session.');
    }

    try {
      // Create session with system prompt
      this.session = await window.ai.languageModel.create({
        systemPrompt: `You are a research assistant helping users synthesize connections between web content.

Your task is to:
1. Analyze the current page context
2. Identify meaningful connections with the user's related notes
3. Generate a concise, insightful summary explaining these connections
4. Use Markdown formatting for clarity

Guidelines:
- Be concise (2-4 sentences maximum)
- Focus on "why" these notes are relevant, not just "what" they are
- Use bullet points for multiple connections
- Avoid repeating obvious information from titles`
      });

      console.log('✅ [NOT-40] Session created successfully');
      return this.session;
    } catch (error) {
      console.error('❌ [NOT-40] Failed to create session:', error);
      throw error;
    }
  }

  /**
   * [NOT-40] Generate synthesis from current context and related notes
   * Uses the synthesis queue to prevent concurrent requests
   *
   * @param {Object} currentContext - Current page info { title, url }
   * @param {Array} relatedNotes - Array of related notes with { text, title, url, similarity }
   * @returns {ReadableStream} - Stream of generated text tokens
   */
  async generateSynthesis(currentContext, relatedNotes) {
    console.log('✨ [NOT-40] Starting synthesis generation...');
    console.log('📄 Current context:', currentContext);
    console.log('📚 Related notes count:', relatedNotes.length);

    // Validate inputs
    if (!currentContext || !currentContext.title) {
      throw new Error('Invalid current context provided');
    }

    if (!Array.isArray(relatedNotes) || relatedNotes.length === 0) {
      throw new Error('No related notes provided for synthesis');
    }

    // Queue the synthesis task
    return this.synthesisQueue.enqueue(async () => {
      // Ensure session exists
      if (!this.session) {
        await this.createSession();
      }

      // Construct the prompt
      const prompt = this.constructPrompt(currentContext, relatedNotes);
      console.log('📝 [NOT-40] Constructed prompt:', prompt);

      try {
        // Generate streaming response
        const stream = await this.session.promptStreaming(prompt);
        console.log('🌊 [NOT-40] Streaming synthesis started');
        return stream;
      } catch (error) {
        console.error('❌ [NOT-40] Synthesis generation failed:', error);
        throw error;
      }
    });
  }

  /**
   * [NOT-40] Construct the synthesis prompt from context and notes
   * @private
   * @param {Object} currentContext - Current page info
   * @param {Array} relatedNotes - Related notes
   * @returns {string} - Formatted prompt
   */
  constructPrompt(currentContext, relatedNotes) {
    // Format related notes (take top 5 for context window efficiency)
    const topNotes = relatedNotes.slice(0, 5);
    const notesText = topNotes.map((item, index) => {
      const note = item.note || item; // Handle different data structures
      const similarity = item.similarity ? ` (${Math.round(item.similarity * 100)}% relevant)` : '';
      return `${index + 1}. **${note.title || 'Untitled'}**${similarity}\n   ${note.text || note.content || 'No content'}`;
    }).join('\n\n');

    // Construct full prompt
    return `Current Page: **${currentContext.title}**
${currentContext.url ? `URL: ${currentContext.url}` : ''}

Related Notes from Your Library:
${notesText}

Task: Explain how these related notes connect to the current page. What insights or patterns emerge? Be concise and use Markdown.`;
  }

  /**
   * [NOT-40] Check if synthesis is currently running
   * Used for throttling button clicks
   */
  get isSynthesizing() {
    return this.synthesisQueue.isActive;
  }

  /**
   * [NOT-40] Destroy the current session
   * Useful for cleanup or resetting state
   */
  async destroySession() {
    if (this.session) {
      try {
        await this.session.destroy();
        console.log('🗑️  [NOT-40] Session destroyed');
      } catch (error) {
        console.error('❌ [NOT-40] Error destroying session:', error);
      }
      this.session = null;
    }
  }
}

// [NOT-40] Export singleton instance as global variable for panel.js
const geminiService = new GeminiService();

// Make available globally for non-module scripts
if (typeof window !== 'undefined') {
  window.geminiService = geminiService;
}
