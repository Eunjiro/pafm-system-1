// Quick test file to verify cemetery plots API integration
async function testCemeteryPlotsAPI() {
  try {
    console.log('🧪 Testing Cemetery Plots API Integration...')
    
    // Test direct backend call
    console.log('\n1. Testing direct backend API call...')
    try {
      const backendResponse = await fetch('http://localhost:3001/api/plots?limit=5', {
        headers: {
          'Authorization': `Bearer test-token`,
          'Content-Type': 'application/json'
        }
      })
      
      const backendData = await backendResponse.json()
      
      if (backendResponse.ok) {
        console.log('✅ Backend API working!')
        console.log(`   Found ${backendData.data?.length || 0} plots`)
        console.log(`   Total plots: ${backendData.pagination?.total || 0}`)
      } else {
        console.log('❌ Backend API failed:', backendResponse.status)
        console.log('   Error:', backendData.error || backendData.message)
      }
    } catch (error) {
      console.log('❌ Backend connection failed:', error.message)
    }
    
    // Test frontend API proxy
    console.log('\n2. Testing frontend API proxy...')
    try {
      const frontendResponse = await fetch('http://localhost:3000/api/cemetery-plots?limit=5')
      const frontendData = await frontendResponse.json()
      
      if (frontendResponse.ok) {
        console.log('✅ Frontend API proxy working!')
        console.log(`   Found ${frontendData.plots?.length || 0} plots`)
        console.log(`   Total plots: ${frontendData.total || 0}`)
        console.log('   Success:', frontendData.success)
        if (frontendData.message) {
          console.log('   Message:', frontendData.message)
        }
      } else {
        console.log('❌ Frontend API proxy failed:', frontendResponse.status)
        console.log('   Data:', frontendData)
      }
    } catch (error) {
      console.log('❌ Frontend connection failed:', error.message)
    }
    
    // Test statistics API
    console.log('\n3. Testing statistics API...')
    try {
      const statsResponse = await fetch('http://localhost:3000/api/cemetery-statistics')
      const statsData = await statsResponse.json()
      
      if (statsResponse.ok) {
        console.log('✅ Statistics API working!')
        console.log('   Statistics:', statsData.statistics)
        if (statsData.message) {
          console.log('   Message:', statsData.message)
        }
      } else {
        console.log('❌ Statistics API failed:', statsResponse.status)
        console.log('   Data:', statsData)
      }
    } catch (error) {
      console.log('❌ Statistics connection failed:', error.message)
    }
    
    console.log('\n🎯 Test Summary Complete!')
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message)
  }
}

// Run the test
console.log('🚀 Starting Cemetery API Integration Tests...')
testCemeteryPlotsAPI()