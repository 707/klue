// [NOT-57] Shared utility functions for Knowledge Clipper
// Used by both background.js and panel.js

/**
 * [NOT-57] Base MetadataExtractor class
 * Implements the Strategy Pattern for domain-specific metadata extraction
 *
 * Why: Different content types (GitHub repos, YouTube videos, articles) have
 * different rich metadata that we want to capture into flexible_metadata
 */
class MetadataExtractor {
  /**
   * Check if this strategy applies to the current page
   * @returns {boolean}
   */
  static matches() {
    throw new Error('matches() must be implemented by subclass');
  }

  /**
   * Extract metadata from the current page
   * @returns {Object} Metadata object with { title, author, siteName, favicon, flexible_metadata }
   */
  static extract() {
    throw new Error('extract() must be implemented by subclass');
  }

  /**
   * [NOT-57] Helper: Extract base metadata (shared by all strategies)
   * @returns {Object} Basic metadata object
   */
  static extractBaseMetadata() {
    const metadata = {
      title: document.title || 'Untitled',
      author: null,
      siteName: null,
      favicon: null,
      flexible_metadata: {} // [NOT-57] Dynamic JSON for domain-specific data
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
}

/**
 * [NOT-57] GitHubStrategy - Extract rich metadata from GitHub repositories
 * Captures: stars, language, last commit, description, topics
 */
class GitHubStrategy extends MetadataExtractor {
  static matches() {
    return window.location.hostname === 'github.com' &&
           window.location.pathname.split('/').length >= 3;
  }

  static extract() {
    const metadata = this.extractBaseMetadata();
    metadata.flexible_metadata.type = 'repo';

    try {
      // Extract stars count
      const starsElement = document.querySelector('[href$="/stargazers"] .Counter, a[href*="/stargazers"] strong');
      if (starsElement) {
        const starsText = starsElement.textContent.trim();
        // Parse "1.2k" → 1200, "15" → 15
        const multipliers = { k: 1000, m: 1000000 };
        const match = starsText.toLowerCase().match(/^([\d.]+)([km])?$/);
        if (match) {
          const num = parseFloat(match[1]);
          const multiplier = multipliers[match[2]] || 1;
          metadata.flexible_metadata.stars = Math.round(num * multiplier);
        }
      }

      // Extract primary language
      const languageElement = document.querySelector('[itemprop="programmingLanguage"]');
      if (languageElement) {
        metadata.flexible_metadata.language = languageElement.textContent.trim();
      }

      // Extract description
      const descElement = document.querySelector('[data-pjax="#repo-content-pjax-container"] p, .f4.my-3');
      if (descElement) {
        metadata.flexible_metadata.description = descElement.textContent.trim();
      }

      // Extract repository owner/name
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2) {
        metadata.flexible_metadata.owner = pathParts[0];
        metadata.flexible_metadata.repo = pathParts[1];
      }

      // Extract topics/tags
      const topicElements = document.querySelectorAll('a[data-octo-click="topic_click"]');
      if (topicElements.length > 0) {
        metadata.flexible_metadata.topics = Array.from(topicElements)
          .map(el => el.textContent.trim())
          .filter(Boolean);
      }

      console.log('✅ [NOT-57] GitHub metadata extracted:', metadata.flexible_metadata);
    } catch (error) {
      console.warn('⚠️  [NOT-57] Failed to extract GitHub metadata:', error);
    }

    return metadata;
  }
}

/**
 * [NOT-57] YouTubeStrategy - Extract rich metadata from YouTube videos
 * Captures: duration, channel, views, upload date, category
 */
class YouTubeStrategy extends MetadataExtractor {
  static matches() {
    return window.location.hostname.includes('youtube.com') &&
           (window.location.pathname.includes('/watch') || window.location.pathname.includes('/shorts'));
  }

  static extract() {
    const metadata = this.extractBaseMetadata();
    metadata.flexible_metadata.type = 'video';

    try {
      // Extract video duration from meta tag
      const durationMeta = document.querySelector('meta[itemprop="duration"]');
      if (durationMeta) {
        const duration = durationMeta.content; // Format: "PT10M5S" (ISO 8601)
        // Parse PT10M5S → "10:05"
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (match) {
          const hours = match[1] ? parseInt(match[1]) : 0;
          const minutes = match[2] ? parseInt(match[2]) : 0;
          const seconds = match[3] ? parseInt(match[3]) : 0;

          if (hours > 0) {
            metadata.flexible_metadata.duration = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
          } else {
            metadata.flexible_metadata.duration = `${minutes}:${String(seconds).padStart(2, '0')}`;
          }
        }
      }

      // Extract channel name
      const channelLink = document.querySelector('ytd-channel-name a, #owner-name a, #channel-name a');
      if (channelLink) {
        metadata.flexible_metadata.channel = channelLink.textContent.trim();
      }

      // Extract view count
      const viewsElement = document.querySelector('.view-count, ytd-video-view-count-renderer');
      if (viewsElement) {
        metadata.flexible_metadata.views = viewsElement.textContent.trim();
      }

      // Extract upload date
      const uploadDateMeta = document.querySelector('meta[itemprop="uploadDate"]');
      if (uploadDateMeta) {
        metadata.flexible_metadata.uploadDate = uploadDateMeta.content;
      }

      // Extract video category
      const categoryMeta = document.querySelector('meta[itemprop="genre"]');
      if (categoryMeta) {
        metadata.flexible_metadata.category = categoryMeta.content;
      }

      console.log('✅ [NOT-57] YouTube metadata extracted:', metadata.flexible_metadata);
    } catch (error) {
      console.warn('⚠️  [NOT-57] Failed to extract YouTube metadata:', error);
    }

    return metadata;
  }
}

/**
 * [NOT-57] DefaultStrategy - Standard OpenGraph metadata extraction
 * Used for general webpages that don't have domain-specific scrapers
 */
class DefaultStrategy extends MetadataExtractor {
  static matches() {
    return true; // Default strategy always matches
  }

  static extract() {
    const metadata = this.extractBaseMetadata();
    metadata.flexible_metadata.type = 'article'; // Default type

    try {
      // Extract article-specific metadata if available
      const articleType = document.querySelector('meta[property="og:type"]');
      if (articleType) {
        metadata.flexible_metadata.type = articleType.content;
      }

      // Extract publish date
      const publishDate = document.querySelector('meta[property="article:published_time"]') ||
                          document.querySelector('meta[name="publish_date"]');
      if (publishDate) {
        metadata.flexible_metadata.publishDate = publishDate.content;
      }

      // Extract reading time if available
      const readingTime = document.querySelector('meta[name="twitter:data1"]');
      if (readingTime && readingTime.content.includes('min read')) {
        metadata.flexible_metadata.readingTime = readingTime.content;
      }

      console.log('✅ [NOT-57] Default metadata extracted:', metadata.flexible_metadata);
    } catch (error) {
      console.warn('⚠️  [NOT-57] Failed to extract default metadata:', error);
    }

    return metadata;
  }
}

/**
 * [NOT-57] Main metadata extraction function using Strategy Pattern
 * Automatically selects the appropriate strategy based on the current page
 *
 * @returns {Object} Metadata object with title, author, siteName, favicon, and flexible_metadata
 */
function extractPageMetadata() {
  // [NOT-57] Strategy selection: try each strategy until one matches
  const strategies = [
    GitHubStrategy,
    YouTubeStrategy,
    DefaultStrategy // Always matches (fallback)
  ];

  for (const Strategy of strategies) {
    if (Strategy.matches()) {
      console.log(`🎯 [NOT-57] Using ${Strategy.name} for metadata extraction`);
      return Strategy.extract();
    }
  }

  // Should never reach here (DefaultStrategy always matches)
  console.warn('⚠️  [NOT-57] No strategy matched, using fallback');
  return DefaultStrategy.extract();
}
