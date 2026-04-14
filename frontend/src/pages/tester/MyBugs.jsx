import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const MyBugs = () => {
    const [bugs, setBugs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/bugs/my').then(res => {
            setBugs(res.data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    return (
        <Layout>
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">My Bugs</h1>
                    <p className="text-slate-400 mt-1">All issues you have reported.</p>
                </div>
            </div>

            <div className="bg-surface border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
                {loading ? <LoadingSpinner /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 bg-slate-900/50 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Project</th>
                                    <th className="px-6 py-4">Priority</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Assigned To</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bugs.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-8 text-slate-500">No bugs found.</td></tr>
                                ) : bugs.map(bug => (
                                    <tr key={bug._id} onClick={() => window.location.href=`/bugs/${bug._id}`} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors cursor-pointer">
                                        <td className="px-6 py-4 font-medium text-slate-200">{bug.title}</td>
                                        <td className="px-6 py-4 text-slate-400">{bug.project?.name || '-'}</td>
                                        <td className="px-6 py-4"><PriorityBadge priority={bug.priority} /></td>
                                        <td className="px-6 py-4"><StatusBadge status={bug.status} /></td>
                                        <td className="px-6 py-4 text-slate-400">{bug.assignedTo?.name || 'Unassigned'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default MyBugs;
