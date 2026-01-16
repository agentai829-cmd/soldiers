const workspaceId = 'cmhv7mv6b000211p8vq739du6'

fetch(`http://localhost:3000/api/workspace/${workspaceId}/subscription`)
  .then(res => res.json())
  .then(data => {
    console.log('📡 API Response:')
    console.log(JSON.stringify(data, null, 2))
  })
  .catch(err => {
    console.error('❌ Error:', err)
  })
