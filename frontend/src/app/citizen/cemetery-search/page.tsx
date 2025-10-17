'use client'

import React, { useState, useEffect } from 'react'
import { Search, MapPin, Navigation, Phone, Clock, User, Calendar, Map, Route, Info, X, Loader } from 'lucide-react'

interface SearchResult {
  id: string
  deceasedName: string
  firstName: string
  lastName: string
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
}

export default function CemeterySearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a name to search')
      return
    }

    setIsSearching(true)
    setError('')
    
    try {
      const response = await fetch(`/api/cemetery-search?query=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.results || [])
        if ((data.results || []).length === 0) {
          setError('No records found. Please try a different name.')
        }
      } else {
        setError(data.error || 'Search failed. Please try again.')
      }
    } catch (error) {
      console.error('Search error:', error)
      setError('Search service is temporarily unavailable.')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Cemetery Search</h1>
          <p className="text-gray-600 text-lg">Find and locate burial sites with ease</p>
        </div>

        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search by deceased person's name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
              >
                {isSearching ? <Loader className="animate-spin" size={20} /> : <Search size={20} />}
                Search
              </button>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Search Results ({searchResults.length})
            </h2>
            <div className="grid gap-4">
              {searchResults.map((result) => (
                <div key={result.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {result.deceasedName}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User size={16} />
                            <span>{result.gender}, Age {result.age}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar size={16} />
                            <span>
                              {new Date(result.dateOfBirth).toLocaleDateString()} - 
                              {new Date(result.dateOfDeath).toLocaleDateString()}
                            </span>
                          </div>
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
                            <span>Buried: {new Date(result.burialDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {result.gravestone?.inscription && (
                        <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-700">Inscription:</p>
                          <p className="text-gray-600 italic">"{result.gravestone.inscription}"</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => setSelectedResult(result)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <Info size={16} />
                        Details
                      </button>
                      
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <Navigation size={16} />
                        Navigate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedResult && (
          <div className="fixed inset-0 bg-black bg-opacity-1 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedResult.deceasedName}</h2>
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Date of Birth</label>
                      <p className="text-gray-900">{new Date(selectedResult.dateOfBirth).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Date of Death</label>
                      <p className="text-gray-900">{new Date(selectedResult.dateOfDeath).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Burial Location</label>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MapPin className="text-blue-600" size={20} />
                        <span className="font-medium text-blue-900">
                          {selectedResult.plotLocation.section} - {selectedResult.plotLocation.block} - 
                          Plot {selectedResult.plotLocation.plotNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Assistance?</h3>
            <p className="text-gray-600 mb-4">
              If you can't find what you're looking for, please contact the cemetery office.
            </p>
            <div className="flex justify-center items-center gap-2 text-blue-600">
              <Phone size={16} />
              <span className="font-medium">(02) 123-4567</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}