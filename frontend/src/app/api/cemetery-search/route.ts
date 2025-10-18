import { NextRequest, NextResponse } from 'next/server';

// GET - Search for deceased persons in cemetery burial records
export async function GET(request: NextRequest) {
  try {
    console.log('=== Cemetery Search API Called ===');
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Please enter at least 2 characters to search',
        results: []
      });
    }

    console.log('Searching for:', query);

    // Search in backend database for burial records
    // Use test-token for development since this is a public citizen service
    const authToken = 'test-token';

    // Get all cemeteries with their complete structure (sections, blocks, plots, assignments)
    const cemeteriesResponse = await fetch('http://localhost:3001/api/cemeteries', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!cemeteriesResponse.ok) {
      console.error('Backend cemeteries API failed:', cemeteriesResponse.status);
      return NextResponse.json({
        success: false,
        error: 'Cemetery search service temporarily unavailable',
        results: []
      });
    }

    const cemeteriesData = await cemeteriesResponse.json();
    console.log('Cemeteries data received:', cemeteriesData.success ? 'Success' : 'Failed');

    if (!cemeteriesData.success || !cemeteriesData.data) {
      return NextResponse.json({
        success: false,
        error: 'No burial records found',
        results: []
      });
    }

    // Process search results from cemetery structure
    const searchResults: any[] = [];
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);

    // Search through all cemeteries, sections, blocks, and plots
    for (const cemetery of cemeteriesData.data) {
      if (cemetery.sections && cemetery.sections.length > 0) {
        for (const section of cemetery.sections) {
          if (section.blocks && section.blocks.length > 0) {
            for (const block of section.blocks) {
              if (block.plots && block.plots.length > 0) {
                for (const plot of block.plots) {
                  if (plot.assignments && plot.assignments.length > 0) {
                    for (const assignment of plot.assignments) {
                      if (assignment.deceased) {
                        const deceased = assignment.deceased;
                        const fullName = `${deceased.firstName || ''} ${deceased.middleName || ''} ${deceased.lastName || ''}`.toLowerCase();
                        
                        // Check if search terms match any part of the name
                        const matches = searchTerms.some(term => 
                          fullName.includes(term) ||
                          (deceased.firstName && deceased.firstName.toLowerCase().includes(term)) ||
                          (deceased.lastName && deceased.lastName.toLowerCase().includes(term)) ||
                          (deceased.middleName && deceased.middleName.toLowerCase().includes(term))
                        );

                        if (matches) {
                          // Calculate age
                          let age = 0;
                          if (deceased.dateOfBirth && deceased.dateOfDeath) {
                            const birth = new Date(deceased.dateOfBirth);
                            const death = new Date(deceased.dateOfDeath);
                            age = Math.floor((death.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                          }

                          // Get plot coordinates
                          let coordinates: [number, number] = [14.6760, 121.0437]; // Default to Quezon City
                          if (plot.latitude && plot.longitude) {
                            coordinates = [parseFloat(plot.latitude), parseFloat(plot.longitude)];
                          } else if (plot.coordinates && plot.coordinates.length > 0) {
                            coordinates = [plot.coordinates[0][0], plot.coordinates[0][1]];
                          }

                          const result: any = {
                            id: assignment.id.toString(),
                            deceasedName: `${deceased.firstName || ''} ${deceased.middleName || ''} ${deceased.lastName || ''}`.trim(),
                            firstName: deceased.firstName || '',
                            lastName: deceased.lastName || '',
                            middleName: deceased.middleName || '',
                            dateOfBirth: deceased.dateOfBirth || '',
                            dateOfDeath: deceased.dateOfDeath || '',
                            burialDate: assignment.assignedAt || deceased.dateOfDeath || '',
                            age: age,
                            gender: deceased.sex || deceased.gender || 'unknown',
                            plotLocation: {
                              section: section.name || 'Unknown Section',
                              block: block.name || 'Unknown Block', 
                              plotNumber: plot.plotNumber || plot.plotCode || 'Unknown Plot',
                              coordinates: coordinates
                            },
                            cemetery: {
                              id: cemetery.id,
                              name: cemetery.name || 'Unknown Cemetery'
                            },
                            plotDetails: {
                              size: plot.size || 'standard',
                              type: plot.type || 'ground_burial',
                              baseFee: parseFloat(plot.baseFee) || 0,
                              maintenanceFee: parseFloat(plot.maintenanceFee) || 0
                            }
                          };

                          // Add gravestone information if available
                          if (plot.gravestones && plot.gravestones.length > 0) {
                            const gravestone = plot.gravestones[0];
                            result.gravestone = {
                              material: gravestone.material || 'unknown',
                              inscription: gravestone.inscription || '',
                              condition: gravestone.condition || 'unknown'
                            };
                          }

                          searchResults.push(result);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Remove duplicates and sort by relevance
    const uniqueResults = searchResults.filter((result: any, index: any, self: any) => 
      index === self.findIndex((r: any) => r.id === result.id)
    );

    // Sort by name similarity (exact matches first)
    uniqueResults.sort((a: any, b: any) => {
      const aName = a.deceasedName.toLowerCase();
      const bName = b.deceasedName.toLowerCase();
      const queryLower = query.toLowerCase();
      
      // Exact matches first
      if (aName.includes(queryLower) && !bName.includes(queryLower)) return -1;
      if (!aName.includes(queryLower) && bName.includes(queryLower)) return 1;
      
      // Then alphabetical
      return aName.localeCompare(bName);
    });

    console.log(`Found ${uniqueResults.length} search results for: ${query}`);

    return NextResponse.json({
      success: true,
      results: uniqueResults,
      total: uniqueResults.length,
      query: query
    });

  } catch (error) {
    console.error('Cemetery search error:', error);
    return NextResponse.json({
      success: false,
      error: 'Search service error. Please try again.',
      results: []
    });
  }
}