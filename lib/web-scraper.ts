export interface ScrapedContent {
  title: string;
  content: string;
  description?: string;
  url: string;
  wordCount: number;
  success: boolean;
  error?: string;
  image?: string;
  favicon?: string;
  aiDescription?: string;
  images?: Array<{
    src: string;
    alt: string;
    title?: string;
    width?: number;
    height?: number;
  }>;
}

/**
 * Basic HTML parser without external dependencies
 */
function parseHTML(html: string, baseUrl: string) {
  // Extract title using regex
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extract meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const description = descMatch ? descMatch[1] : '';

  // Extract Open Graph image
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  let image = ogImageMatch ? ogImageMatch[1] : '';

  // If no OG image, try Twitter card image
  if (!image) {
    const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    image = twitterImageMatch ? twitterImageMatch[1] : '';
  }

  // If no social media image, try to find first meaningful image
  if (!image) {
    const imgMatches = html.match(/<img[^>]*src=["']([^"']*)["'][^>]*/gi);
    if (imgMatches) {
      for (const imgMatch of imgMatches) {
        const srcMatch = imgMatch.match(/src=["']([^"']*)["']/i);
        if (srcMatch) {
          const src = srcMatch[1];
          // Skip small icons, data URLs, and common non-content images
          if (!src.includes('data:') && 
              !src.includes('icon') && 
              !src.includes('logo') && 
              !src.includes('favicon') &&
              !src.match(/\d+x\d+/) || 
              src.match(/(\d+)x(\d+)/) && parseInt(src.match(/(\d+)x(\d+)/)?.[1] || '0') > 200) {
            image = src;
            break;
          }
        }
      }
    }
  }

  // Make image URL absolute if it's relative
  if (image && !image.startsWith('http')) {
    try {
      const base = new URL(baseUrl);
      image = new URL(image, base.origin).toString();
    } catch {
      image = '';
    }
  }

  // Extract all images from the page
  const images: Array<{src: string; alt: string; title?: string; width?: number; height?: number}> = [];
  const imgMatches = html.match(/<img[^>]*>/gi);
  
  console.log(`🖼️ Found ${imgMatches?.length || 0} img tags in HTML`);
  
  if (imgMatches) {
    for (const imgMatch of imgMatches) {
      const srcMatch = imgMatch.match(/src=["']([^"']*)["']/i);
      const altMatch = imgMatch.match(/alt=["']([^"']*)["']/i);
      const titleMatch = imgMatch.match(/title=["']([^"']*)["']/i);
      const widthMatch = imgMatch.match(/width=["']?(\d+)["']?/i);
      const heightMatch = imgMatch.match(/height=["']?(\d+)["']?/i);
      
      if (srcMatch) {
        let src = srcMatch[1];
        
        // Skip data URLs, very small images, and common non-content images
        if (src.includes('data:') || 
            src.includes('spacer') || 
            src.includes('pixel') ||
            src.includes('blank') ||
            src.match(/\d+x\d+/) && parseInt(src.match(/(\d+)x(\d+)/)?.[1] || '0') < 50) {
          continue;
        }
        
        // Make URL absolute
        if (!src.startsWith('http')) {
          try {
            const base = new URL(baseUrl);
            src = new URL(src, base.origin).toString();
          } catch {
            continue;
          }
        }
        
        const alt = altMatch ? altMatch[1] : '';
        const title = titleMatch ? titleMatch[1] : '';
        const width = widthMatch ? parseInt(widthMatch[1]) : undefined;
        const height = heightMatch ? parseInt(heightMatch[1]) : undefined;
        
        // Include all images that pass basic filtering
        // More permissive - include images with alt text, reasonable dimensions, or any images if no dimensions
        images.push({
          src,
          alt: alt || title || '',
          title,
          width,
          height
        });
      }
    }
  }

  console.log(`🖼️ Extracted ${images.length} valid images after filtering`);

  // Extract favicon
  let favicon = '';
  const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']*)["'][^>]*/i);
  if (faviconMatch) {
    favicon = faviconMatch[1];
    if (favicon && !favicon.startsWith('http')) {
      try {
        const base = new URL(baseUrl);
        favicon = new URL(favicon, base.origin).toString();
      } catch {
        favicon = '';
      }
    }
  }

  // Remove script and style tags
  let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleanHtml = cleanHtml.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  cleanHtml = cleanHtml.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  cleanHtml = cleanHtml.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');

  // Extract text content from HTML tags
  let textContent = cleanHtml.replace(/<[^>]*>/g, ' ');
  
  // Clean up whitespace
  textContent = textContent
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  // Remove very short lines and common navigation text
  const lines = textContent.split('\n');
  const meaningfulLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 15 && 
           !trimmed.match(/^(home|about|contact|menu|search|login|register|privacy|terms)$/i);
  });
  
  const content = meaningfulLines.join('\n');

  return {
    title: title || 'Untitled Page',
    description,
    content,
    image,
    favicon,
    images
  };
}

/**
 * Scrape content from a website URL
 */
export async function scrapeWebsite(url: string): Promise<ScrapedContent> {
  try {
    console.log('🕷️ Starting to scrape website:', url);
    
    // Validate URL
    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch (error) {
      throw new Error('Invalid URL format');
    }

    // Fetch the webpage
    const response = await fetch(validUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log('📄 HTML fetched, parsing content...');

    // Parse HTML content
    const parsed = parseHTML(html, validUrl.toString());

    let { title, content, description, image, favicon, images } = parsed;

    // Clean title
    title = title.replace(/\s+/g, ' ').trim();
    if (title.length > 200) {
      title = title.substring(0, 200) + '...';
    }

    if (!content || content.length < 50) {
      throw new Error('Unable to extract meaningful content from the webpage');
    }

    // Limit content length (keep first 50,000 characters to avoid overwhelming the database)
    if (content.length > 50000) {
      content = content.substring(0, 50000) + '\n\n[Content truncated...]';
    }

    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

    console.log(`✅ Successfully scraped website:`, {
      title: title.substring(0, 50) + '...',
      contentLength: content.length,
      wordCount,
      url: validUrl.toString()
    });

    console.log(`🖼️ Scraped result contains ${images?.length || 0} images`);

    return {
      title,
      content,
      description,
      image,
      favicon,
      images,
      url: validUrl.toString(),
      wordCount,
      success: true
    };

  } catch (error) {
    console.error('❌ Error scraping website:', error);
    
    return {
      title: 'Failed to scrape website',
      content: `Failed to scrape content from ${url}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      url,
      wordCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract domain from URL for display purposes
 */
export function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Validate if URL is scrapeable (basic security checks)
 */
export function isValidWebUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Block localhost and private IPs for security
    const hostname = parsedUrl.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname.startsWith('127.') || 
        hostname.startsWith('192.168.') || 
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}