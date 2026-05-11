'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function Analytics() {
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    groupBy: 'day'
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchReport();
  }, [router]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const params = new URLSearchParams(filters).toString();
      
      const res = await axios.get(`http://localhost:3000/api/analytics/costs/report?${params}`, { headers });
      setReport(res.data.report);
      setTotals(res.data.totals);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const exportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(filters).toString();
      
      const res = await axios.get(`http://localhost:3000/api/analytics/costs/export?format=csv&${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'costs-report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">📊 Analytics & Reports</h1>
          <button onClick={exportCSV} className="btn btn-primary">
            📥 Export CSV
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <div className="card">
          <form onSubmit={applyFilters} className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Type</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="input"
              >
                <option value="">All Types</option>
                <option value="message">Message</option>
                <option value="image">Image</option>
                <option value="api_call">API Call</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Group By</label>
              <select
                name="groupBy"
                value={filters.groupBy}
                onChange={handleFilterChange}
                className="input"
              >
                <option value="day">Daily</option>
                <option value="hour">Hourly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              🔍 Apply
            </button>
          </form>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card">
            <p className="text-gray-500 text-sm">Total Amount</p>
            <p className="text-3xl font-bold mt-2">${totals?.totalAmount?.toFixed(4) || '0.00'}</p>
          </div>
          <div className="card">
            <p className="text-gray-500 text-sm">Total Points</p>
            <p className="text-3xl font-bold mt-2">{totals?.totalPoints?.toLocaleString() || 0}</p>
          </div>
          <div className="card">
            <p className="text-gray-500 text-sm">Total Requests</p>
            <p className="text-3xl font-bold mt-2">{totals?.count?.toLocaleString() || 0}</p>
          </div>
        </div>

        {/* Report Table */}
        <div className="card">
          <h3 className="font-semibold mb-4">📋 Cost Report</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Date</th>
                    <th className="text-right p-3">Requests</th>
                    <th className="text-right p-3">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {(report || []).map((row, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-mono">{row._id}</td>
                      <td className="p-3 text-right">{row.count?.toLocaleString()}</td>
                      <td className="p-3 text-right font-semibold">${row.total?.toFixed(4)}</td>
                    </tr>
                  ))}
                  {(report || []).length === 0 && (
                    <tr>
                      <td colSpan="3" className="p-8 text-center text-gray-500">
                        No data found for the selected filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}