import { useState, useEffect } from 'react';

const PerformanceMarketingDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await fetch('/api/performance-marketing');
                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }
                const data = await response.json();
                setDashboardData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="p-4 text-gray-600">Loading performance marketing data...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-600">Error: {error}</div>;
    }

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Marketing Dashboard</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-gray-600 text-sm">Campaigns</p>
                    <p className="text-2xl font-bold text-blue-600">-</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-gray-600 text-sm">Conversions</p>
                    <p className="text-2xl font-bold text-green-600">-</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <p className="text-gray-600 text-sm">ROI</p>
                    <p className="text-2xl font-bold text-purple-600">-</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-gray-600 text-sm">Spend</p>
                    <p className="text-2xl font-bold text-orange-600">-</p>
                </div>
            </div>
        </div>
    );
};

export default PerformanceMarketingDashboard;
