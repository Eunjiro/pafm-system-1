// Test API connectivity
async function testAPIs() {
  console.log('=== API Connectivity Test ===');
  
  try {
    // 1. Test auth status
    console.log('1. Checking auth...');
    const authResponse = await fetch('/api/auth/session');
    const authData = await authResponse.json();
    console.log('Auth session:', authData);
    
    // 2. Test backend health
    console.log('2. Testing backend health...');
    const healthResponse = await fetch('/api/health');
    const healthData = await healthResponse.json();
    console.log('Backend health:', healthData);
    
    // 3. Test permits API (admin)
    console.log('3. Testing permits API...');
    const permitsResponse = await fetch('/api/permits');
    console.log('Permits response status:', permitsResponse.status);
    const permitsData = await permitsResponse.json();
    console.log('Permits data:', permitsData);
    
    // 4. Test citizen permits API
    console.log('4. Testing citizen permits API...');
    const citizenPermitsResponse = await fetch('/api/permits/citizen');
    console.log('Citizen permits status:', citizenPermitsResponse.status);
    const citizenPermitsData = await citizenPermitsResponse.json();
    console.log('Citizen permits data:', citizenPermitsData);
    
  } catch (error) {
    console.error('API test error:', error);
  }
}

testAPIs();