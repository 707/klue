// Regression tests for bug fixes
import { getState, setState, setMode } from '../../modules/state.js';
import { renderAIChatMode, initAIChat } from '../../modules/ai-chat.js';

console.log('Bug Fixes Test Suite loaded');

// Wait for window.testSuite to be available
const runTests = async () => {

    // Force Mock chrome API
    window.chrome = {
        storage: {
            local: {
                get: async () => ({}),
                set: async () => { },
                remove: async () => { }
            },
            onChanged: {
                addListener: () => { },
                removeListener: () => { }
            }
        },
        runtime: {
            sendMessage: async () => { }
        },
        tabs: {
            query: async () => ([{ id: 1, url: 'http://example.com' }]),
            sendMessage: async () => ({ text: 'Page content' }),
            onActivated: { addListener: () => { } },
            onUpdated: { addListener: () => { } }
        },
        scripting: {
            executeScript: async () => ([{ result: {} }])
        }
    };

    // Initialize AI Chat module properly for all tests
    console.log('Initializing AI Chat module mock dependencies...');
    initAIChat({
        log: console.log,
        warn: console.warn,
        error: console.error
    });

    // Mock DOM elements required for AI Chat
    const setupChatDOM = () => {
        // Create container if not exists
        if (!document.getElementById('ai-chat-mode')) {
            const container = document.createElement('div');
            container.id = 'ai-chat-mode';
            document.body.appendChild(container);

            const messages = document.createElement('div');
            messages.id = 'chat-messages';
            document.body.appendChild(messages);

            const input = document.createElement('textarea');
            input.id = 'chat-input';
            document.body.appendChild(input);

            const sendBtn = document.createElement('button');
            sendBtn.id = 'send-chat-button';
            document.body.appendChild(sendBtn);

            const clearBtn = document.createElement('button');
            clearBtn.id = 'clear-chat-button';
            document.body.appendChild(clearBtn);

            const emptyState = document.createElement('div');
            emptyState.id = 'chat-empty-state';
            document.body.appendChild(emptyState);
        }
    };

    await window.testSuite('Bug Fix - Chat API Signature', async () => {
        setupChatDOM();

        // Mock aiHarness with spy
        let sendMessageCalled = false;
        let functionalityVerified = false;

        window.aiHarness = {
            // It should NOT call .chat() anymore
            chat: () => {
                window.assert(false, 'Should NOT call .chat() method (deprecated)');
            },
            // It SHOULD call .sendMessage()
            sendMessage: (text, context, onChunk, onComplete) => {
                sendMessageCalled = true;
                console.log('Mock sendMessage called');

                // Verify arguments
                if (typeof onChunk === 'function' && typeof onComplete === 'function') {
                    functionalityVerified = true;
                }

                // Simulate success
                onComplete();
                return Promise.resolve();
            }
        };

        // Initialize chat
        await renderAIChatMode();

        // Simulate user sending a message
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-chat-button');

        input.value = 'Hello world';
        // Trigger click
        try {
            await sendBtn.onclick();
        } catch (e) {
            console.error(e);
        }

        window.assert(sendMessageCalled, 'Called aiHarness.sendMessage');
        window.assert(functionalityVerified, 'Passed correct callbacks to sendMessage');
    });

    await window.testSuite('Bug Fix - Chat Input Sanitization', async () => {
        setupChatDOM();
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-chat-button');

        let sendMessageCalled = false;
        window.aiHarness = {
            sendMessage: (text) => {
                sendMessageCalled = true;
                return Promise.resolve();
            }
        };

        // Test 1: Valid string input
        await renderAIChatMode('Hello AI');
        window.assert(input.value === 'Hello AI', 'Input should be set from string argument');

        // Wait for auto-send timeout
        await new Promise(resolve => setTimeout(resolve, 150));
        window.assert(sendMessageCalled, 'Should auto-send valid string input');

        // Test 2: Invalid input (Event object) - simulating the bug
        sendMessageCalled = false;
        input.value = '';
        const mockEvent = { type: 'click', preventDefault: () => { } };

        await renderAIChatMode(mockEvent);

        window.assert(input.value === '', 'Input should remain empty for non-string argument');
        window.assert(!input.value.includes('PointerEvent'), 'Should not stringify event object');

        // Wait to ensure NO auto-send
        await new Promise(resolve => setTimeout(resolve, 150));
        window.assert(!sendMessageCalled, 'Should NOT auto-send for invalid input');
    });

    // Clean up
    const teardown = () => {
        const ids = ['ai-chat-mode', 'chat-messages', 'chat-input', 'send-chat-button', 'clear-chat-button', 'chat-empty-state'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    };
    teardown();
};

if (window.testSuite) {
    runTests();
} else {
    window.addEventListener('load', runTests);
}
