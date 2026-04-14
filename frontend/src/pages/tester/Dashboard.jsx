import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Layout from '../../components/Layout';
import { Bug, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0, resolved: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/bugs/my');
        const bugs = res.data;
        
        setStats({
          total: bugs.length,
          valid: bugs.filter(b => b.mlClassification?.isValid).length,
          invalid: bugs.filter(b => b.mlClassification?.isValid === false).length,
          resolved: bugs.filter(b => b.status === 'Resolved').length
        });
        
        setRecent(bugs.slice(-5).reverse());
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome, {user?.name}</h1>
          <p className="text-slate-400 mt-1">Here is the overview of your reported bugs.</p>
        </div>
        <Link to="/tester/submit" className="px-5 py-2.5 bg-primary hover:bg-blue-600 text-white font-medium rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
            <Bug className="w-4 h-4"/> Report Bug
        </Link>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Bug} title="Total Submitted" value={stats.total} color="text-blue-400" bg="bg-blue-400/10" />
        <StatCard icon={CheckCircle} title="Valid Bugs" value={stats.valid} color="text-emerald-400" bg="bg-emerald-400/10" />
        <StatCard icon={AlertCircle} title="Invalid/Rejected" value={stats.invalid} color="text-red-400" bg="bg-red-400/10" />
        <StatCard icon={Clock} title="Resolved" value={stats.resolved} color="text-purple-400" bg="bg-purple-400/10" />
      </div>

      <div className="bg-surface border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-700/50 bg-slate-800/20">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 bg-slate-900/50 uppercase">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                   <td colSpan="4" className="text-center py-6 text-slate-500">No bugs submitted yet.</td>
                </tr>
              ) : recent.map((bug) => (
                <tr key={bug._id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => window.location.href = `/bugs/${bug._id}`}>
                  <td className="px-6 py-4 font-medium text-slate-200">{bug.title}</td>
                  <td className="px-6 py-4 text-slate-400">{bug.project?.name || 'Unknown'}</td>
                  <td className="px-6 py-4"><PriorityBadge priority={bug.priority} /></td>
                  <td className="px-6 py-4"><StatusBadge status={bug.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

const StatCard = ({ icon: Icon, title, value, color, bg }) => (
    <div className="bg-surface border border-slate-700/50 rounded-2xl p-6 shadow-lg">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-white">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${bg} ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    </div>
);

export default Dashboard;
