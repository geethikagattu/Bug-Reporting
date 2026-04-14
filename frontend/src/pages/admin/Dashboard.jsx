import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState({ totalBugs: 0, openBugs: 0, resolvedBugs: 0, totalUsers: 0, activeProjects: 0, resolutionRate: 0 });

    useEffect(() => {
        api.get('/admin/dashboard').then(res => setStats(res.data)).catch(console.error);
    }, []);

    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
                <p className="text-slate-400 mt-1">System-wide overview of BugFlow AI.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-8">
                {Object.entries(stats).map(([k, v]) => (
                    <div key={k} className="bg-surface border border-slate-700/50 rounded-2xl p-6 shadow-lg">
                        <p className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <h3 className="text-3xl font-bold text-white">{k === 'resolutionRate' ? `${v}%` : v}</h3>
                    </div>
                ))}
            </div>
            
            <div className="p-12 text-center border-2 border-dashed border-slate-700 rounded-2xl text-slate-500">
                Data charts placeholder (e.g. Recharts)
            </div>
        </Layout>
    );
};

export default Dashboard;
