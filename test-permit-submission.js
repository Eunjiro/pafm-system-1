// Test script to submit a permit as a citizen
// To use: Sign in as a citizen, then run this in the browser console on /citizen/services/permits

async function testPermitSubmission() {
  console.log('🧪 Testing permit submission...');
  
  try {
    // Step 1: Create deceased record
    console.log('1️⃣ Creating deceased record...');
    const deceasedResponse = await fetch('/api/deceased', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        middleName: '',
        lastName: 'Deceased',
        suffix: '',
        dateOfBirth: new Date('1950-01-01'),
        dateOfDeath: new Date('2024-01-01'),
        placeOfDeath: 'Test Hospital',
        age: 74,
        sex: 'MALE'
      })
    });
    
    console.log('Deceased response status:', deceasedResponse.status);
    const deceasedData = await deceasedResponse.json();
    console.log('Deceased data:', deceasedData);
    
    if (!deceasedData.success) {
      throw new Error('Failed to create deceased record: ' + deceasedData.error);
    }
    
    // Step 2: Create permit request
    console.log('2️⃣ Creating permit request...');
    const permitResponse = await fetch('/api/permits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        permitType: 'burial',
        deceasedId: deceasedData.data.id,
        documents: ['death_cert', 'id']
      })
    });
    
    console.log('Permit response status:', permitResponse.status);
    const permitData = await permitResponse.json();
    console.log('Permit data:', permitData);
    
    if (permitResponse.ok) {
      console.log('✅ SUCCESS! Permit submitted successfully');
      console.log('🎯 Permit ID:', permitData.permit?.id);
      console.log('📋 Check admin panel now!');
    } else {
      console.log('❌ FAILED! Permit submission failed');
      console.log('Error:', permitData.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Auto-run the test
testPermitSubmission();