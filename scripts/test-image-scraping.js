// Test image scraping directly
const { scrapeWebsite } = require('../lib/web-scraper.ts');

async function testImageScraping() {
  console.log('🧪 Testing image scraping functionality...\n');
  
  const testUrl = 'https://outsourceorigin.com/';
  
  try {
    console.log(`🕷️ Scraping: ${testUrl}`);
    const result = await scrapeWebsite(testUrl);
    
    console.log('\n📊 Scraping Results:');
    console.log(`  Title: ${result.title}`);
    console.log(`  Content Length: ${result.content.length}`);
    console.log(`  Word Count: ${result.wordCount}`);
    console.log(`  Main Image: ${result.image || 'None'}`);
    console.log(`  Favicon: ${result.favicon || 'None'}`);
    
    console.log('\n🖼️ Images Array:');
    if (result.images && result.images.length > 0) {
      console.log(`  Found ${result.images.length} images:`);
      result.images.forEach((img, index) => {
        console.log(`    ${index + 1}. ${img.src}`);
        console.log(`       Alt: "${img.alt}"`);
        console.log(`       Title: "${img.title || 'N/A'}"`);
        console.log(`       Dimensions: ${img.width || 'auto'} x ${img.height || 'auto'}`);
        console.log('');
      });
    } else {
      console.log('  ❌ No images found!');
    }
    
    console.log('\n🎯 Test completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testImageScraping();