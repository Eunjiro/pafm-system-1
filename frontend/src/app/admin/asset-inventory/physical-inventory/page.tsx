"use client"

import { useState, useEffect } from "react"
import { 
  FiPlus, 
  FiTrash2, 
  FiX, 
  FiAlertTriangle,
  FiCheckCircle,
  FiPackage,
  FiBarChart2,
  FiRefreshCw
} from "react-icons/fi"

interface CountSession {
  id: number
  sessionNumber: string
  sessionDate: string
  countedBy: string
  status: "IN_PROGRESS" | "DISCREPANCY_FOUND" | "BALANCED" | "COMPLETED"
  totalItems: number
  itemsWithDiscrepancy: number
  totalDiscrepancyValue: number
  remarks: string | null
  createdAt: string
}

interface Item {
  id: number
  itemCode: string
  description: string
  unit: string
  unitCost: number
  category: string
}

interface CountEntry {
  id: number
  sessionId: number
  itemId: number
  systemQuantity: number
  actualQuantity: number
  discrepancy: number
  discrepancyValue: number
  remarks: string | null
  item: Item
}

interface NewSession {
  sessionDate: string
  countedBy: string
  remarks: string
}

interface NewCountEntry {
  itemId: number
  actualQuantity: number
  remarks: string
}

export default function PhysicalInventoryPage() {
  const [sessions, setSessions] = useState<CountSession[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [countEntries, setCountEntries] = useState<CountEntry[]>([])
  const [selectedSession, setSelectedSession] = useState<CountSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)
  const [showCountModal, setShowCountModal] = useState(false)
  const [activeTab, setActiveTab] = useState<"sessions" | "counting" | "discrepancies">("sessions")

  const [newSession, setNewSession] = useState<NewSession>({
    sessionDate: new Date().toISOString().split('T')[0],
    countedBy: "",
    remarks: "",
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [newCountEntry, setNewCountEntry] = useState<NewCountEntry>({
    itemId: 0,
    actualQuantity: 0,
    remarks: "",
  })

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/asset-inventory/physical-inventory/sessions")
      const data = await response.json()
      if (data.success) {
        setSessions(data.data)
      }
    } catch (error) {
      console.error("Error fetching sessions:", error)
      alert("Failed to fetch count sessions")
    } finally {
      setLoading(false)
    }
  }

  // Fetch items
  const fetchItems = async () => {
    try {
      const response = await fetch("/api/asset-inventory/items")
      const data = await response.json()
      if (data.success) {
        setItems(data.data)
      }
    } catch (error) {
      console.error("Error fetching items:", error)
    }
  }

  // Fetch count entries for a session
  const fetchCountEntries = async (sessionId: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/asset-inventory/physical-inventory/sessions/${sessionId}/entries`)
      const data = await response.json()
      if (data.success) {
        setCountEntries(data.data)
      }
    } catch (error) {
      console.error("Error fetching count entries:", error)
      alert("Failed to fetch count entries")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
    fetchItems()
  }, [])

  useEffect(() => {
    if (selectedSession) {
      fetchCountEntries(selectedSession.id)
    }
  }, [selectedSession])

  // Create new count session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSession.countedBy.trim()) {
      alert("Please enter counter name")
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/asset-inventory/physical-inventory/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSession),
      })

      const data = await response.json()
      if (data.success) {
        alert("Count session created successfully!")
        setShowNewSessionModal(false)
        setNewSession({
          sessionDate: new Date().toISOString().split('T')[0],
          countedBy: "",
          remarks: "",
        })
        fetchSessions()
      } else {
        alert(data.message || "Failed to create count session")
      }
    } catch (error) {
      console.error("Error creating session:", error)
      alert("Failed to create count session")
    } finally {
      setLoading(false)
    }
  }

  // Select session for counting
  const handleSelectSession = (session: CountSession) => {
    if (session.status !== "IN_PROGRESS") {
      alert("Can only count items in IN_PROGRESS sessions")
      return
    }
    setSelectedSession(session)
    setActiveTab("counting")
  }

  // Add count entry
  const handleAddCountEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSession) return
    if (newCountEntry.itemId === 0) {
      alert("Please select an item")
      return
    }

    try {
      setLoading(true)
      const response = await fetch(
        `/api/asset-inventory/physical-inventory/sessions/${selectedSession.id}/entries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCountEntry),
        }
      )

      const data = await response.json()
      if (data.success) {
        setShowCountModal(false)
        setNewCountEntry({
          itemId: 0,
          actualQuantity: 0,
          remarks: "",
        })
        fetchCountEntries(selectedSession.id)
        fetchSessions() // Refresh to update counts
      } else {
        alert(data.message || "Failed to add count entry")
      }
    } catch (error) {
      console.error("Error adding count entry:", error)
      alert("Failed to add count entry")
    } finally {
      setLoading(false)
    }
  }

  // Complete count session
  const handleCompleteSession = async (sessionId: number) => {
    if (!confirm("Mark this count session as completed? You won't be able to add more counts.")) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(
        `/api/asset-inventory/physical-inventory/sessions/${sessionId}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      )

      const data = await response.json()
      if (data.success) {
        alert("Count session completed successfully!")
        fetchSessions()
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null)
        }
      } else {
        alert(data.message || "Failed to complete session")
      }
    } catch (error) {
      console.error("Error completing session:", error)
      alert("Failed to complete session")
    } finally {
      setLoading(false)
    }
  }

  // Create adjustment for discrepancies
  const handleCreateAdjustment = async (sessionId: number) => {
    const adjustmentReason = prompt("Enter reason for adjustment:")
    if (!adjustmentReason || !adjustmentReason.trim()) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(
        `/api/asset-inventory/physical-inventory/sessions/${sessionId}/adjust`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adjustmentReason }),
        }
      )

      const data = await response.json()
      if (data.success) {
        alert(`Adjustment created successfully! ${data.data.adjustmentsCreated} stock movements recorded.`)
        fetchSessions()
        if (selectedSession?.id === sessionId) {
          const updatedSession = sessions.find(s => s.id === sessionId)
          if (updatedSession) {
            setSelectedSession({ ...updatedSession, status: "COMPLETED" })
          }
        }
      } else {
        alert(data.message || "Failed to create adjustment")
      }
    } catch (error) {
      console.error("Error creating adjustment:", error)
      alert("Failed to create adjustment")
    } finally {
      setLoading(false)
    }
  }

  // Delete session
  const handleDeleteSession = async (sessionId: number) => {
    if (!confirm("Are you sure you want to delete this count session?")) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(
        `/api/asset-inventory/physical-inventory/sessions/${sessionId}`,
        {
          method: "DELETE",
        }
      )

      const data = await response.json()
      if (data.success) {
        alert("Count session deleted successfully!")
        fetchSessions()
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null)
        }
      } else {
        alert(data.message || "Failed to delete session")
      }
    } catch (error) {
      console.error("Error deleting session:", error)
      alert("Failed to delete session")
    } finally {
      setLoading(false)
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800"
      case "DISCREPANCY_FOUND":
        return "bg-orange-100 text-orange-800"
      case "BALANCED":
        return "bg-green-100 text-green-800"
      case "COMPLETED":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Filter items for count entry
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter
    
    // Don't show items already counted in this session
    const alreadyCounted = countEntries.some(entry => entry.itemId === item.id)
    
    return matchesSearch && matchesCategory && !alreadyCounted
  })

  // Get unique categories
  const categories = ["ALL", ...new Set(items.map(item => item.category))]

  // Calculate summary statistics
  const discrepancyEntries = countEntries.filter(entry => entry.discrepancy !== 0)
  const totalDiscrepancyValue = discrepancyEntries.reduce((sum, entry) => sum + Math.abs(entry.discrepancyValue), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Physical Inventory</h1>
          <p className="text-gray-600">Count sessions and discrepancy management</p>
        </div>
        <button
          onClick={() => setShowNewSessionModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FiPlus /> New Count Session
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("sessions")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "sessions"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <FiBarChart2 /> Count Sessions
            </div>
          </button>
          <button
            onClick={() => setActiveTab("counting")}
            disabled={!selectedSession}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "counting"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } ${!selectedSession ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center gap-2">
              <FiPackage /> Item Counting {selectedSession && `(${selectedSession.sessionNumber})`}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("discrepancies")}
            disabled={!selectedSession}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "discrepancies"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } ${!selectedSession ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center gap-2">
              <FiAlertTriangle /> Discrepancies {selectedSession && countEntries.length > 0 && `(${discrepancyEntries.length})`}
            </div>
          </button>
        </nav>
      </div>

      {/* Sessions Tab */}
      {activeTab === "sessions" && (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Counted By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items Counted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discrepancies</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Variance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No count sessions found. Create one to start physical inventory counting.
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{session.sessionNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(session.sessionDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {session.countedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                          {session.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {session.totalItems}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {session.itemsWithDiscrepancy > 0 ? (
                          <span className="flex items-center gap-1 text-orange-600">
                            <FiAlertTriangle size={14} /> {session.itemsWithDiscrepancy}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-600">
                            <FiCheckCircle size={14} /> 0
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={session.totalDiscrepancyValue !== 0 ? "text-red-600 font-semibold" : "text-green-600"}>
                          ₱{session.totalDiscrepancyValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {session.status === "IN_PROGRESS" && (
                            <>
                              <button
                                onClick={() => handleSelectSession(session)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Count Items"
                              >
                                <FiPackage size={18} />
                              </button>
                              <button
                                onClick={() => handleCompleteSession(session.id)}
                                className="text-green-600 hover:text-green-800"
                                title="Complete Session"
                              >
                                <FiCheckCircle size={18} />
                              </button>
                            </>
                          )}
                          {(session.status === "DISCREPANCY_FOUND" || session.status === "BALANCED") && session.itemsWithDiscrepancy > 0 && (
                            <button
                              onClick={() => handleCreateAdjustment(session.id)}
                              className="text-purple-600 hover:text-purple-800"
                              title="Create Adjustment"
                            >
                              <FiRefreshCw size={18} />
                            </button>
                          )}
                          {session.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => handleDeleteSession(session.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete Session"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Counting Tab */}
      {activeTab === "counting" && selectedSession && (
        <div className="space-y-4">
          {/* Session Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedSession.sessionNumber}</h2>
                <p className="text-sm text-gray-600">Counted by: {selectedSession.countedBy}</p>
                <p className="text-sm text-gray-600">Date: {new Date(selectedSession.sessionDate).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => setShowCountModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FiPlus /> Add Count
              </button>
            </div>
          </div>

          {/* Count Entries */}
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">System Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discrepancy</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value Impact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {countEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No items counted yet. Click "Add Count" to start.
                      </td>
                    </tr>
                  ) : (
                    countEntries.map((entry) => (
                      <tr key={entry.id} className={entry.discrepancy !== 0 ? "bg-orange-50" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.item.itemCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {entry.item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {entry.item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {entry.systemQuantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {entry.actualQuantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={entry.discrepancy !== 0 ? "font-semibold text-orange-600" : "text-green-600"}>
                            {entry.discrepancy > 0 ? "+" : ""}{entry.discrepancy}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={entry.discrepancyValue !== 0 ? "font-semibold text-red-600" : "text-green-600"}>
                            ₱{Math.abs(entry.discrepancyValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {entry.remarks || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Discrepancies Tab */}
      {activeTab === "discrepancies" && selectedSession && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <FiAlertTriangle className="text-orange-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Items with Discrepancies</p>
                  <p className="text-2xl font-bold text-gray-900">{discrepancyEntries.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <FiBarChart2 className="text-red-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Variance Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₱{totalDiscrepancyValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FiCheckCircle className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Accurate Counts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {countEntries.length - discrepancyEntries.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Discrepancy Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Discrepancy Details</h3>
              <p className="text-sm text-gray-600 mt-1">
                Items where actual count differs from system quantity
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">System</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actual</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value Impact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {discrepancyEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <FiCheckCircle className="text-green-500" size={48} />
                          <p>No discrepancies found! All counts match system quantities.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    discrepancyEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.item.itemCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {entry.item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {entry.systemQuantity} {entry.item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {entry.actualQuantity} {entry.item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={`font-semibold ${entry.discrepancy > 0 ? "text-green-600" : "text-red-600"}`}>
                            {entry.discrepancy > 0 ? "+" : ""}{entry.discrepancy}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                          ₱{entry.item.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={`font-semibold ${entry.discrepancyValue > 0 ? "text-green-600" : "text-red-600"}`}>
                            {entry.discrepancyValue > 0 ? "+" : ""}₱{Math.abs(entry.discrepancyValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {entry.remarks || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          {(selectedSession.status === "DISCREPANCY_FOUND" || selectedSession.status === "BALANCED") && discrepancyEntries.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create Stock Adjustment</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    This will create stock movements to reconcile all discrepancies
                  </p>
                </div>
                <button
                  onClick={() => handleCreateAdjustment(selectedSession.id)}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  disabled={loading}
                >
                  <FiRefreshCw /> Create Adjustment
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">New Count Session</h2>
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Date *
                </label>
                <input
                  type="date"
                  value={newSession.sessionDate}
                  onChange={(e) => setNewSession({ ...newSession, sessionDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Counted By *
                </label>
                <input
                  type="text"
                  value={newSession.countedBy}
                  onChange={(e) => setNewSession({ ...newSession, countedBy: e.target.value })}
                  placeholder="Enter name of person counting"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  value={newSession.remarks}
                  onChange={(e) => setNewSession({ ...newSession, remarks: e.target.value })}
                  placeholder="Optional remarks or notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Count Modal */}
      {showCountModal && selectedSession && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">Add Count Entry</h2>
              <button
                onClick={() => setShowCountModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleAddCountEntry} className="p-6 space-y-4">
              {/* Search and Filter */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Items
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by code or description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Item Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Item *
                </label>
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {filteredItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {countEntries.length === items.length 
                        ? "All items have been counted" 
                        : "No items match your search"}
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setNewCountEntry({ ...newCountEntry, itemId: item.id })}
                        className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                          newCountEntry.itemId === item.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{item.itemCode}</p>
                            <p className="text-sm text-gray-600">{item.description}</p>
                            <p className="text-xs text-gray-500">{item.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{item.unit}</p>
                            <p className="text-xs text-gray-500">₱{item.unitCost.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Quantity *
                </label>
                <input
                  type="number"
                  value={newCountEntry.actualQuantity}
                  onChange={(e) => setNewCountEntry({ ...newCountEntry, actualQuantity: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  placeholder="Enter counted quantity"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  value={newCountEntry.remarks}
                  onChange={(e) => setNewCountEntry({ ...newCountEntry, remarks: e.target.value })}
                  placeholder="Optional notes about this count"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCountModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || newCountEntry.itemId === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add Count"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
