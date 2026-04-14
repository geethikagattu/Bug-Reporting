import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalAssigned: 0, inProgress: 0, resolved: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api.get('/developer/dashboard').then(res => setStats(res.data)).catch(console.error);
    api.get('/developer/bugs').then(res => setRecent(res.data.slice(-5).reverse())).catch(console.error);
  }, []);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Developer Dashboard</h1>
        <p className="text-slate-400 mt-1">AI has routed these bugs directly to you.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-slate-700/50 rounded-2xl p-6 shadow-lg">
            <p className="text-slate-400 text-sm font-medium mb-1">Total Assigned</p>
            <h3 className="text-3xl font-bold text-white">{stats.totalAssigned}</h3>
        </div>
        <div className="bg-surface border border-slate-700/50 rounded-2xl p-6 shadow-lg">
            <p className="text-slate-400 text-sm font-medium mb-1">In Progress</p>
            <h3 className="text-3xl font-bold text-amber-500">{stats.inProgress}</h3>
        </div>
        <div className="bg-surface border border-slate-700/50 rounded-2xl p-6 shadow-lg">
            <p className="text-slate-400 text-sm font-medium mb-1">Resolved Recently</p>
            <h3 className="text-3xl font-bold text-emerald-500">{stats.resolved}</h3>
        </div>
      </div>
      
      {/* Could reuse BugTable here */}
    </Layout>
  );
};

export default Dashboard;
