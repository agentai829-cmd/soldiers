// Script to test adding a website with images through the API
const fs = require('fs');

async function testWebsiteWithImages() {
  const workspaceId = 'cmhv7mv6b000211p8vq739du6'; // Your workspace ID
  
  // Test with a website that has many images
  const testUrl = 'https://unsplash.com'; // This website has lots of images
  
  try {
    console.log('🧪 Testing website upload with image processing...');
    console.log(`📡 Adding website: ${testUrl}`);
    
    const formData = new FormData();
    formData.append('type', 'url');
    formData.append('sourceUrl', testUrl);
    formData.append('title', 'Unsplash - Beautiful Free Images');
    
    const response = await fetch(`http://localhost:3000/api/workspace/${workspaceId}/brain/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success!');
      console.log(`📄 Knowledge Document ID: ${result.knowledgeDoc.id}`);
      console.log(`📊 Content Length: ${result.knowledgeDoc.content.length} characters`);
      
      if (result.knowledgeDoc.metadata?.processedImages) {
        console.log(`🖼️ Processed Images: ${result.knowledgeDoc.metadata.processedImages.length}`);
        result.knowledgeDoc.metadata.processedImages.forEach((img, index) => {
          console.log(`  ${index + 1}. ${img.src}`);
          console.log(`     Alt: ${img.alt}`);
          console.log(`     AI Description: ${img.aiDescription}`);
          console.log('');
        });
      }
      
      console.log('🎉 Test completed successfully!');
    } else {
      const error = await response.text();
      console.error('❌ Error:', error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testWebsiteWithImages();