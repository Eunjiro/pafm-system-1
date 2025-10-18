'use client'

import React, { useState, useEffect } from 'react'
import { Search, MapPin, Navigation, Phone, Clock, User, Calendar, Map, Route, Info, X, Loader, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface SearchResult {
  id: string
  deceasedName: string
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth: string
  dateOfDeath: string
  burialDate: string
  age: number
  gender: string
  plotLocation: {
    section: string
    block: string
    plotNumber: string
    coordinates: [number, number]
  }
  gravestone?: {
    material: string
    inscription: string
    condition: string
  }
  cemetery?: {
    id: number
    name: string
  }
  plotDetails?: {
    size: string
    type: string
    baseFee: number
    maintenanceFee: number
  }
}

export default function CemeterySearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState('')
  const [navigationData, setNavigationData] = useState<any>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a name to search')
      return
    }

    setIsSearching(true)
    setError('')
    
    try {
      console.log('Searching for:', searchQuery)
      const response = await fetch(`/api/cemetery-search?query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      console.log('Search response:', data)
      
      if (data.success) {
        setSearchResults(data.results || [])
        if ((data.results || []).length === 0) {
          setError('No records found. Please try a different name or spelling.')
        }
      } else {
        setError(data.error || 'Search failed. Please try again.')
      }
    } catch (error) {
      console.error('Search error:', error)
      setError('Search service is temporarily unavailable. Please try again later.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleNavigateToPlot = async (result: SearchResult) => {
    setIsNavigating(true);
    setError('');
    
    try {
      // Get user's current location
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const userCoords: [number, number] = [
        position.coords.longitude, 
        position.coords.latitude
      ];
      
      setUserLocation([position.coords.latitude, position.coords.longitude]);

      // Get AI navigation route using OpenRouteService
      console.log('Getting navigation route...');
      const navigationResponse = await fetch('/api/openroute-navigation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: userCoords,
          end: [result.plotLocation.coordinates[1], result.plotLocation.coordinates[0]], // [lng, lat]
          profile: 'driving-car'
        })
      });

      if (!navigationResponse.ok) {
        const errorData = await navigationResponse.text();
        console.error('Navigation API error:', errorData);
        throw new Error(`Navigation service error: ${navigationResponse.status}`);
      }

      const navData = await navigationResponse.json();
      
      if (navData.success) {
        setNavigationData(navData);
        setSelectedResult(result);
        
        // Show navigation instructions
        console.log('Navigation route calculated successfully');
        console.log(`Distance: ${(navData.route.distance / 1000).toFixed(2)}km`);
        console.log(`Duration: ${Math.round(navData.route.duration / 60)}min`);
        console.log(`Source: ${navData.metadata?.source || 'unknown'}`);
        
        // If it's using Google Maps fallback, automatically open Google Maps
        if (navData.route.useGoogleMaps) {
          const shouldOpenMaps = window.confirm(
            `Navigation will use Google Maps for turn-by-turn directions.\n\n` +
            `Distance: ${(navData.route.distance / 1000).toFixed(1)}km\n` +
            `Estimated time: ${Math.round(navData.route.duration / 60)} minutes\n\n` +
            `Would you like to open Google Maps now?`
          );
          
          if (shouldOpenMaps) {
            window.open(navData.route.googleMapsUrl, '_blank');
          }
        }
      } else {
        throw new Error(navData.error || 'Failed to calculate route');
      }
      
    } catch (error) {
      console.error('Navigation error:', error);
      if (error instanceof GeolocationPositionError) {
        setError('Location access denied. Please enable location services and try again.');
      } else {
        setError(error instanceof Error ? error.message : 'Navigation service unavailable');
      }
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/citizen" className="hover:text-blue-600">Citizen Portal</Link>
            <span>›</span>
            <Link href="/citizen/services" className="hover:text-blue-600">Services</Link>
            <span>›</span>
            <span className="text-gray-900 font-medium">Cemetery Search</span>
          </nav>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/citizen/services"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Services</span>
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Cemetery Search</h1>
          <p className="text-gray-600 text-lg">Find and locate burial sites in Quezon City cemeteries</p>
          <p className="text-sm text-gray-500 mt-2">Search by deceased person's name to find burial location and details</p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Enter deceased person's name (first name, last name, or both)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2 min-w-[120px]"
              >
                {isSearching ? <Loader className="animate-spin" size={20} /> : <Search size={20} />}
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <div className="flex items-center space-x-2">
                  <Info size={16} />
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Search Results ({searchResults.length} {searchResults.length === 1 ? 'record' : 'records'} found)
            </h2>
            <div className="grid gap-4">
              {searchResults.map((result) => (
                <div key={result.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {result.deceasedName}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User size={16} />
                            <span>{result.gender === 'male' ? 'Male' : result.gender === 'female' ? 'Female' : 'Unknown'}, Age {result.age}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar size={16} />
                            <span>
                              {new Date(result.dateOfBirth).toLocaleDateString('en-PH')} - 
                              {new Date(result.dateOfDeath).toLocaleDateString('en-PH')}
                            </span>
                          </div>
                          {result.cemetery && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Map size={16} />
                              <span>{result.cemetery.name}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin size={16} />
                            <span>
                              {result.plotLocation.section} - {result.plotLocation.block} - 
                              Plot {result.plotLocation.plotNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock size={16} />
                            <span>Buried: {new Date(result.burialDate).toLocaleDateString('en-PH')}</span>
                          </div>
                          {result.plotDetails && (
                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                              <span>Plot Type: {result.plotDetails.type || result.plotDetails.size}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {result.gravestone?.inscription && (
                        <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-700">Gravestone Inscription:</p>
                          <p className="text-gray-600 italic">"{result.gravestone.inscription}"</p>
                          {result.gravestone.material && (
                            <p className="text-xs text-gray-500 mt-1">Material: {result.gravestone.material}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => setSelectedResult(result)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
                      >
                        <Info size={16} />
                        Details
                      </button>
                      
                      <button 
                        onClick={() => handleNavigateToPlot(result)}
                        disabled={isNavigating}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
                      >
                        {isNavigating ? <Loader className="animate-spin" size={16} /> : <Navigation size={16} />}
                        {isNavigating ? 'Getting Route...' : 'AI Navigation'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Navigation Modal */}
        {navigationData && selectedResult && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-50 animate-fadeIn">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slideUp shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">AI Navigation to {selectedResult.deceasedName}</h2>
                    <p className="text-gray-600 mt-1">
                      {selectedResult.plotLocation.section} - {selectedResult.plotLocation.block} - 
                      Plot {selectedResult.plotLocation.plotNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setNavigationData(null);
                      setSelectedResult(null);
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                {/* Route Summary */}
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {(navigationData.route.distance / 1000).toFixed(1)}km
                      </div>
                      <div className="text-sm text-gray-600">Distance</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(navigationData.route.duration / 60)}min
                      </div>
                      <div className="text-sm text-gray-600">Estimated Time</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {navigationData.route.instructions?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Turn Instructions</div>
                    </div>
                  </div>
                  
                  {/* Navigation Source Indicator */}
                  <div className="mt-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      navigationData.metadata?.source === 'openrouteservice' 
                        ? 'bg-green-100 text-green-700' 
                        : navigationData.metadata?.source === 'google-maps-fallback'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {navigationData.metadata?.source === 'openrouteservice' 
                        ? '🗺️ AI-Powered Route' 
                        : navigationData.metadata?.source === 'google-maps-fallback'
                        ? '🌐 Google Maps Navigation'
                        : '📍 Basic Navigation'}
                    </span>
                  </div>
                </div>

                {/* Google Maps Navigation Section */}
                {navigationData.route.useGoogleMaps ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      🌐 Google Maps Navigation
                    </h3>
                    
                    <div className="bg-blue-50 p-6 rounded-lg text-center">
                      <div className="mb-4">
                        <div className="text-blue-600 text-4xl mb-2">🗺️</div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          Turn-by-Turn Navigation Available
                        </h4>
                        <p className="text-gray-600 mb-4">
                          Get real-time directions with Google Maps for the best navigation experience.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <button
                          onClick={() => window.open(navigationData.route.googleMapsUrl, '_blank')}
                          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
                        >
                          <span>🌐</span>
                          Open in Browser
                        </button>
                        
                        <button
                          onClick={() => {
                            // Try to open Google Maps app, fallback to browser
                            const appUrl = navigationData.route.googleMapsAppUrl;
                            const browserUrl = navigationData.route.googleMapsUrl;
                            
                            // Create a hidden iframe to test if the app opens
                            const iframe = document.createElement('iframe');
                            iframe.style.display = 'none';
                            iframe.src = appUrl;
                            document.body.appendChild(iframe);
                            
                            // Fallback to browser after a short delay
                            setTimeout(() => {
                              document.body.removeChild(iframe);
                              window.open(browserUrl, '_blank');
                            }, 2000);
                          }}
                          className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                        >
                          <span>📱</span>
                          Open in App
                        </button>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <p>📍 Destination: {selectedResult.plotLocation.section} - {selectedResult.plotLocation.block}</p>
                        <p>📋 Plot: {selectedResult.plotLocation.plotNumber}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Original turn-by-turn instructions for OpenRouteService */
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Turn-by-Turn Directions
                    </h3>
                  
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {navigationData.route.instructions?.map((instruction: any, index: number) => (
                      <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">{instruction.instruction}</p>
                          {instruction.name && (
                            <p className="text-gray-600 text-sm mt-1">on {instruction.name}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>
                              {instruction.distance > 1000 
                                ? `${(instruction.distance / 1000).toFixed(1)}km` 
                                : `${Math.round(instruction.distance)}m`}
                            </span>
                            <span>
                              {instruction.duration > 60 
                                ? `${Math.round(instruction.duration / 60)}min` 
                                : `${Math.round(instruction.duration)}s`}
                            </span>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center text-gray-500 py-8">
                        No detailed instructions available
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                  <button
                    onClick={() => {
                      setNavigationData(null);
                      setSelectedResult(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  
                  {userLocation && (
                    <button
                      onClick={() => {
                        // Open in external map app (Google Maps)
                        const destination = `${selectedResult.plotLocation.coordinates[0]},${selectedResult.plotLocation.coordinates[1]}`;
                        const googleMapsUrl = `https://www.google.com/maps/dir/${userLocation[0]},${userLocation[1]}/${destination}`;
                        window.open(googleMapsUrl, '_blank');
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
                    >
                      <Route size={16} />
                      Open in Maps
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      // Start live navigation (refresh route)
                      handleNavigateToPlot(selectedResult);
                    }}
                    disabled={isNavigating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
                  >
                    {isNavigating ? <Loader className="animate-spin" size={16} /> : <Navigation size={16} />}
                    {isNavigating ? 'Updating...' : 'Refresh Route'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedResult && !navigationData && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-50 animate-fadeIn">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedResult.deceasedName}</h2>
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Full Name</label>
                        <p className="text-gray-900">{selectedResult.deceasedName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Gender</label>
                        <p className="text-gray-900 capitalize">{selectedResult.gender === 'male' ? 'Male' : selectedResult.gender === 'female' ? 'Female' : 'Unknown'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Date of Birth</label>
                        <p className="text-gray-900">{new Date(selectedResult.dateOfBirth).toLocaleDateString('en-PH')}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Date of Death</label>
                        <p className="text-gray-900">{new Date(selectedResult.dateOfDeath).toLocaleDateString('en-PH')}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Age at Death</label>
                        <p className="text-gray-900">{selectedResult.age} years old</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Burial Date</label>
                        <p className="text-gray-900">{new Date(selectedResult.burialDate).toLocaleDateString('en-PH')}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cemetery Location */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Burial Location</h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <MapPin className="text-blue-600 mt-1" size={20} />
                        <div>
                          <p className="font-medium text-blue-900">
                            {selectedResult.plotLocation.section} - {selectedResult.plotLocation.block} - 
                            Plot {selectedResult.plotLocation.plotNumber}
                          </p>
                          {selectedResult.cemetery && (
                            <p className="text-blue-700 text-sm">{selectedResult.cemetery.name}</p>
                          )}
                          <p className="text-blue-600 text-sm mt-1">
                            Coordinates: {selectedResult.plotLocation.coordinates[0].toFixed(6)}, {selectedResult.plotLocation.coordinates[1].toFixed(6)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gravestone Information */}
                  {selectedResult.gravestone && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Gravestone Details</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Material</label>
                            <p className="text-gray-900">{selectedResult.gravestone.material}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Condition</label>
                            <p className="text-gray-900 capitalize">{selectedResult.gravestone.condition}</p>
                          </div>
                        </div>
                        {selectedResult.gravestone.inscription && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Inscription</label>
                            <p className="text-gray-900 italic bg-white p-3 rounded border">
                              "{selectedResult.gravestone.inscription}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Plot Details */}
                  {selectedResult.plotDetails && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Plot Information</h3>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Plot Size</label>
                            <p className="text-gray-900 capitalize">{selectedResult.plotDetails.size}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Plot Type</label>
                            <p className="text-gray-900 capitalize">{selectedResult.plotDetails.type?.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleNavigateToPlot(selectedResult)}
                    disabled={isNavigating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
                  >
                    {isNavigating ? <Loader className="animate-spin" size={16} /> : <Navigation size={16} />}
                    {isNavigating ? 'Getting Route...' : 'AI Navigation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Assistance?</h3>
            <p className="text-gray-600 mb-4">
              If you can't find the record you're looking for or need help with directions to a burial site, 
              please contact the Quezon City Cemetery Office.
            </p>
            <div className="flex justify-center items-center gap-2 text-blue-600 mb-2">
              <Phone size={16} />
              <span className="font-medium">(02) 8988-4242</span>
            </div>
            <p className="text-sm text-gray-500">Office Hours: Monday to Friday, 8:00 AM - 5:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  )
}