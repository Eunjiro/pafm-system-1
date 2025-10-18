"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { FiShield, FiFileText, FiUser, FiAlertTriangle, FiCheckCircle, FiUpload, FiCalendar, FiDollarSign, FiArrowRight, FiInfo } from "react-icons/fi";

interface PermitRequest {
  id: number;
  permitType: 'burial' | 'exhumation' | 'cremation';
  status: string;
  amountDue?: number;
  orNumber?: string;
  createdAt: string;
  deceased?: {
    id: number;
    firstName: string;
    middleName?: string;
    lastName: string;
    suffix?: string;
    dateOfDeath?: string;
  };
  requester?: {
    id: number;
    fullNameFirst: string;
    fullNameLast: string;
    email: string;
  };
  remarks?: string;
}

interface DocumentRequirement {
  type: string;
  label: string;
  required: boolean;
  description: string;
  conditional?: string;
}

type PermitType = 'burial' | 'exhumation' | 'cremation';

export default function CitizenPermitRequests() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeStep, setActiveStep] = useState<'select' | 'details' | 'documents' | 'review'>('select');
  const [selectedPermitType, setSelectedPermitType] = useState<PermitType | null>(null);
  const [permitRequests, setPermitRequests] = useState<PermitRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Form data
  const [deceasedInfo, setDeceasedInfo] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    dateOfDeath: '',
    placeOfDeath: '',
    relationship: ''
  });
  
  const [uploadedDocuments, setUploadedDocuments] = useState<{[key: string]: File}>({});

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "CITIZEN") {
      router.replace("/auth/signin");
      return;
    }
    
    // Check for permit type in URL params
    const permitType = searchParams.get('type') as PermitType;
    if (permitType && ['burial', 'exhumation', 'cremation'].includes(permitType)) {
      setSelectedPermitType(permitType);
      setActiveStep('details');
    }
    
    fetchPermitRequests();
  }, [session, status, router, searchParams]);

  const fetchPermitRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/permits/citizen');
      if (response.ok) {
        const data = await response.json();
        setPermitRequests(data.permits || []);
      }
    } catch (error) {
      console.error('Error fetching permit requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPermitTypeDetails = (type: PermitType) => {
    const details = {
      burial: {
        title: 'Burial Permit',
        description: 'Authorization for cemetery burial',
        icon: <FiUser size={24} />,
        color: 'blue',
        fee: '₱100 - ₱1,500',
        processTime: '1-2 working days',
        requirements: [
          { type: 'death_cert', label: 'Certified Death Certificate', required: true, description: 'Certified copy of death certificate' },
          { type: 'id', label: 'Valid ID', required: true, description: 'Government-issued ID of applicant' },
          { type: 'transfer_permit', label: 'Transfer/Entrance Permit', required: false, description: 'Required if deceased is from another LGU', conditional: 'From outside QC' },
          { type: 'affidavit_undertaking', label: 'Affidavit of Undertaking', required: false, description: 'Required for Bagbag/Novaliches cemeteries', conditional: 'Bagbag/Novaliches' },
          { type: 'burial_form', label: 'Burial Form (QCHD)', required: false, description: 'QCHD-issued burial form' }
        ] as DocumentRequirement[]
      },
      exhumation: {
        title: 'Exhumation Permit',
        description: 'Authorization for remains removal',
        icon: <FiFileText size={24} />,
        color: 'purple',
        fee: '₱100',
        processTime: '1-2 working days',
        requirements: [
          { type: 'exhumation_letter', label: 'Exhumation Letter (QC Health Dept)', required: true, description: 'Letter from QC Health Department' },
          { type: 'death_cert', label: 'Certified Death Certificate', required: true, description: 'Certified copy of death certificate' },
          { type: 'id', label: 'Valid ID', required: true, description: 'Government-issued ID of applicant' }
        ] as DocumentRequirement[]
      },
      cremation: {
        title: 'Cremation Permit',
        description: 'Authorization for crematorium services',
        icon: <FiAlertTriangle size={24} />,
        color: 'orange',
        fee: '₱100 - ₱200',
        processTime: '1-2 working days',
        requirements: [
          { type: 'death_cert', label: 'Death Certificate', required: true, description: 'Certified copy of death certificate' },
          { type: 'cremation_form', label: 'Cremation Form (QCHD)', required: true, description: 'QCHD-issued cremation form' },
          { type: 'id', label: 'Valid ID', required: true, description: 'Government-issued ID of applicant' },
          { type: 'transfer_permit', label: 'Transfer/Entrance Permit', required: false, description: 'Required if deceased is from another LGU', conditional: 'From outside QC' }
        ] as DocumentRequirement[]
      }
    };
    return details[type];
  };

  const handleFileUpload = (documentType: string, file: File) => {
    setUploadedDocuments(prev => ({
      ...prev,
      [documentType]: file
    }));
  };

  const submitPermitRequest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, create the deceased record
      const deceasedResponse = await fetch('/api/deceased', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: deceasedInfo.firstName,
          middleName: deceasedInfo.middleName || null,
          lastName: deceasedInfo.lastName,
          suffix: deceasedInfo.suffix || null,
          dateOfBirth: new Date('1900-01-01'), // Default for permit requests
          dateOfDeath: deceasedInfo.dateOfDeath,
          placeOfDeath: deceasedInfo.placeOfDeath || null,
          age: 0, // Will be calculated if needed
          sex: 'UNKNOWN' // Default for permit requests
        })
      });

      if (!deceasedResponse.ok) {
        const errorData = await deceasedResponse.json();
        throw new Error(errorData.error || 'Failed to create deceased record');
      }

      const deceasedData = await deceasedResponse.json();
      
      // Then create permit request with the deceased ID
      const permitData = {
        permitType: selectedPermitType,
        deceasedId: deceasedData.deceased.id,
        documents: Object.keys(uploadedDocuments)
      };

      const response = await fetch('/api/permits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permitData)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(`${selectedPermitType?.charAt(0).toUpperCase()}${selectedPermitType?.slice(1)} permit request submitted successfully!`);
        fetchPermitRequests();
        resetForm();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit permit request');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit permit request');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setActiveStep('select');
    setSelectedPermitType(null);
    setDeceasedInfo({
      firstName: '',
      middleName: '',
      lastName: '',
      suffix: '',
      dateOfDeath: '',
      placeOfDeath: '',
      relationship: ''
    });
    setUploadedDocuments({});
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#FBFBFB'}}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#4CAF50'}}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#FBFBFB'}}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 rounded-2xl mx-6">
        <div 
          className="h-1 w-full"
          style={{
            background: 'linear-gradient(135deg, #9C27B0 0%, #4A90E2 100%)'
          }}
        />
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                style={{backgroundColor: '#9C27B0'}}
              >
                <div className="text-white">
                  <FiShield size={24} />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Permit Requests</h1>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600 font-medium">Burial, Exhumation & Cremation</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-500">{permitRequests.length} Active Requests</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
            <FiAlertTriangle className="text-red-500" size={20} />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
            <FiCheckCircle className="text-green-500" size={20} />
            <div>
              <p className="text-green-800 font-medium">Success</p>
              <p className="text-green-600 text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Step 1: Select Permit Type */}
        {activeStep === 'select' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Select Permit Type</h3>
              <p className="text-sm text-gray-500">Choose the type of permit you need to request</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['burial', 'exhumation', 'cremation'] as PermitType[]).map((type) => {
                  const details = getPermitTypeDetails(type);
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedPermitType(type);
                        setActiveStep('details');
                      }}
                      className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 text-left"
                    >
                      <div className="flex flex-col items-center space-y-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-${details.color}-500 text-white`}>
                          {details.icon}
                        </div>
                        <div className="text-center">
                          <h4 className="text-lg font-bold text-gray-900">{details.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{details.description}</p>
                          <div className="mt-3 space-y-1">
                            <p className="text-xs text-gray-600">Fee: {details.fee}</p>
                            <p className="text-xs text-gray-600">Processing: {details.processTime}</p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Deceased Information */}
        {activeStep === 'details' && selectedPermitType && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Deceased Information</h3>
              <p className="text-sm text-gray-500">Provide details about the deceased person</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    value={deceasedInfo.firstName}
                    onChange={(e) => setDeceasedInfo({...deceasedInfo, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                  <input
                    type="text"
                    value={deceasedInfo.middleName}
                    onChange={(e) => setDeceasedInfo({...deceasedInfo, middleName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={deceasedInfo.lastName}
                    onChange={(e) => setDeceasedInfo({...deceasedInfo, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Suffix</label>
                  <input
                    type="text"
                    value={deceasedInfo.suffix}
                    onChange={(e) => setDeceasedInfo({...deceasedInfo, suffix: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Death *</label>
                  <input
                    type="date"
                    value={deceasedInfo.dateOfDeath}
                    onChange={(e) => setDeceasedInfo({...deceasedInfo, dateOfDeath: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Place of Death</label>
                  <input
                    type="text"
                    value={deceasedInfo.placeOfDeath}
                    onChange={(e) => setDeceasedInfo({...deceasedInfo, placeOfDeath: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Relationship to Deceased *</label>
                  <select
                    value={deceasedInfo.relationship}
                    onChange={(e) => setDeceasedInfo({...deceasedInfo, relationship: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="">Select relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Relative">Other Relative</option>
                    <option value="Legal Representative">Legal Representative</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setActiveStep('select')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveStep('documents')}
                  disabled={!deceasedInfo.firstName || !deceasedInfo.lastName || !deceasedInfo.dateOfDeath || !deceasedInfo.relationship}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Next: Documents
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Document Upload */}
        {activeStep === 'documents' && selectedPermitType && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Required Documents</h3>
              <p className="text-sm text-gray-500">Upload the required documents for your {selectedPermitType} permit</p>
            </div>
            <div className="p-6">
              {getPermitTypeDetails(selectedPermitType).requirements.map((req) => (
                <div key={req.type} className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 flex items-center">
                        {req.label}
                        {req.required && <span className="text-red-500 ml-1">*</span>}
                        {req.conditional && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            {req.conditional}
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-500">{req.description}</p>
                    </div>
                    {uploadedDocuments[req.type] && (
                      <FiCheckCircle className="text-green-500" size={20} />
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(req.type, file);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  />
                  {uploadedDocuments[req.type] && (
                    <p className="text-sm text-green-600 mt-1">✓ {uploadedDocuments[req.type].name}</p>
                  )}
                </div>
              ))}
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setActiveStep('details')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setActiveStep('review')}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Review & Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {activeStep === 'review' && selectedPermitType && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Review Your Application</h3>
              <p className="text-sm text-gray-500">Please review all information before submitting</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Permit Type</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium capitalize">{selectedPermitType} Permit</p>
                    <p className="text-sm text-gray-600">{getPermitTypeDetails(selectedPermitType).description}</p>
                    <p className="text-sm text-gray-600">Fee: {getPermitTypeDetails(selectedPermitType).fee}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Deceased Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Name:</strong> {deceasedInfo.firstName} {deceasedInfo.middleName} {deceasedInfo.lastName} {deceasedInfo.suffix}</p>
                    <p><strong>Date of Death:</strong> {new Date(deceasedInfo.dateOfDeath).toLocaleDateString()}</p>
                    {deceasedInfo.placeOfDeath && <p><strong>Place of Death:</strong> {deceasedInfo.placeOfDeath}</p>}
                    <p><strong>Your Relationship:</strong> {deceasedInfo.relationship}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Uploaded Documents</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {Object.keys(uploadedDocuments).length > 0 ? (
                      <ul className="space-y-1">
                        {Object.entries(uploadedDocuments).map(([type, file]) => (
                          <li key={type} className="flex items-center text-sm">
                            <FiCheckCircle className="text-green-500 mr-2" size={16} />
                            {getPermitTypeDetails(selectedPermitType).requirements.find(r => r.type === type)?.label}: {file.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600">No documents uploaded</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setActiveStep('documents')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={submitPermitRequest}
                  disabled={loading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Your Permit Requests */}
        {permitRequests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Your Permit Requests</h3>
              <p className="text-sm text-gray-500">Track the status of your submitted requests</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {permitRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 capitalize">
                          {request.permitType} Permit #{request.id}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {request.deceased ? `${request.deceased.firstName} ${request.deceased.lastName}` : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          request.status === 'issued' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">₱{request.amountDue || 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}