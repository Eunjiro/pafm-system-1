// Test script to check plot navigation functionality
// Run this in the browser console on the plot management page

function testPlotNavigation() {
  console.log('=== Testing Plot Navigation ===')
  
  // Check if we have cemetery data
  const savedCemeteries = localStorage.getItem('cemeteries')
  if (!savedCemeteries) {
    console.log('❌ No cemeteries found in localStorage')
    console.log('Creating test cemetery and plot data...')
    
    // Create test cemetery
    const testCemetery = {
      id: 'test-cemetery-1',
      name: 'Test Cemetery',
      description: 'Test cemetery for navigation',
      address: 'Test Address',
      city: 'Novaliches',
      postalCode: '1100',
      establishedDate: '2024-01-01',
      totalArea: 1000,
      boundary: [[14.6760, 121.0437], [14.6770, 121.0437], [14.6770, 121.0447], [14.6760, 121.0447]],
      standardPrice: 5000,
      largePrice: 8000,
      familyPrice: 12000,
      nichePrice: 3000,
      maintenanceFee: 500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    localStorage.setItem('cemeteries', JSON.stringify([testCemetery]))
    
    // Create test sections with plots
    const testSections = [{
      id: 'section-a',
      cemeteryId: 'test-cemetery-1',
      name: 'Section A',
      description: 'Test Section A',
      color: '#3B82F6',
      capacity: 100,
      boundary: [[14.6761, 121.0438], [14.6769, 121.0438], [14.6769, 121.0446], [14.6761, 121.0446]],
      blocks: [{
        id: 'block-1',
        sectionId: 'section-a',
        name: 'Block 1',
        blockType: 'standard',
        capacity: 20,
        color: '#10B981',
        boundary: [[14.6762, 121.0439], [14.6768, 121.0439], [14.6768, 121.0445], [14.6762, 121.0445]],
        plots: [{
          id: 'plot-test-001',
          blockId: 'block-1',
          plotNumber: 'SEC-A-BLK-1-LOT-001',
          coordinates: [[14.6763, 121.0440], [14.6765, 121.0440], [14.6765, 121.0442], [14.6763, 121.0442]],
          size: 'standard',
          length: 2.0,
          width: 1.0,
          depth: 2.0,
          baseFee: 5000,
          maintenanceFee: 500,
          orientation: 'north',
          accessibility: true,
          status: 'available',
          maxLayers: 3,
          burials: []
        }]
      }]
    }]
    
    localStorage.setItem(`cemetery_test-cemetery-1_sections`, JSON.stringify(testSections))
    
    console.log('✅ Test data created')
  } else {
    console.log('✅ Cemetery data found')
    const cemeteries = JSON.parse(savedCemeteries)
    console.log(`Found ${cemeteries.length} cemeteries:`, cemeteries.map(c => c.name))
    
    // Check sections for first cemetery
    if (cemeteries.length > 0) {
      const firstCemetery = cemeteries[0]
      const sections = localStorage.getItem(`cemetery_${firstCemetery.id}_sections`)
      if (sections) {
        const sectionData = JSON.parse(sections)
        console.log(`Cemetery "${firstCemetery.name}" has ${sectionData.length} sections`)
        
        let plotCount = 0
        sectionData.forEach(section => {
          section.blocks.forEach(block => {
            plotCount += block.plots.length
          })
        })
        console.log(`Total plots found: ${plotCount}`)
        
        if (plotCount > 0) {
          const firstPlot = sectionData[0].blocks[0].plots[0]
          console.log('First plot for testing:', firstPlot.plotNumber, firstPlot.id)
          
          // Test navigation URL
          const testUrl = `/admin/cemetery?id=${firstCemetery.id}&plotId=${firstPlot.id}&focus=true`
          console.log('Test navigation URL:', testUrl)
          console.log('You can copy and paste this URL to test the navigation')
        }
      } else {
        console.log('❌ No sections found for first cemetery')
      }
    }
  }
}

// Run the test
testPlotNavigation()