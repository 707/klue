// ES Module wrapper for Dexie
// Imports the UMD bundle and re-exports as ES module for Service Worker compatibility

import dexieBundle from './dexie.js';

// Dexie UMD bundle exports to either module.exports or window.Dexie
// For ES modules, we need to access the default export
const Dexie = dexieBundle.default || dexieBundle;

export default Dexie;
export { Dexie };
