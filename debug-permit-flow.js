// Debug script to test permit submission and retrieval
// Run this in browser console on citizen permits page

async function testPermitSubmission() {
  console.log('Testing permit submission...');
  
  try {
    // Test 1: Try to fetch existing permits
    console.log('1. Fetching existing permits...');
    const existingResponse = await fetch('/api/permits/citizen');
    const existingData = await existingResponse.json();
    console.log('Existing permits:', existingData);
    
    // Test 2: Check if we can reach the deceased API
    console.log('2. Testing deceased API...');
    const deceasedTest = await fetch('/api/deceased', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '1980-01-01',
        dateOfDeath: '2024-01-01',
        sex: 'MALE'
      })
    });
    const deceasedResult = await deceasedTest.json();
    console.log('Deceased API response:', deceasedResult);
    
    if (deceasedResult.success) {
      // Test 3: Try to create a permit
      console.log('3. Creating permit request...');
      const permitResponse = await fetch('/api/permits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permitType: 'burial',
          deceasedId: deceasedResult.data.id,
          documents: ['death_cert', 'id']
        })
      });
      const permitResult = await permitResponse.json();
      console.log('Permit creation response:', permitResult);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testPermitSubmission();