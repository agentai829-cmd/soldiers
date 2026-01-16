const fetch = require('node-fetch')

async function testAdminAPI() {
  try {
    console.log('🧪 Testing Admin Users API...')
    
    const response = await fetch('http://localhost:3000/api/admin/users')
    const data = await response.json()
    
    console.log('Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testAdminAPI()
