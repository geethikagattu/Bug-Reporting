import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const AllBugs = () => {
    const [bugs, setBugs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/bugs').then(res => {
            setBugs(res.data);
            setLoading(false);
        }).catch(err => setLoading(false));
    }, []);

    return (
        <Layout>
            <div className="mb-6"><h1 className="text-3xl font-bold text-white tracking-tight">All Bugs</h1></div>

            <div className="bg-surface border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
                {loading ? <LoadingSpinner /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 bg-slate-900/50 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Reporter</th>
                                    <th className="px-6 py-4">Assigned To</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bugs.map(bug => (
                                    <tr key={bug._id} onClick={() => window.location.href=`/bugs/${bug._id}`} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors cursor-pointer">
                                        <td className="px-6 py-4 font-medium text-slate-200">{bug.title}</td>
                                        <td className="px-6 py-4 text-slate-400">{bug.reporter?.name}</td>
                                        <td className="px-6 py-4 text-slate-400">{bug.assignedTo?.name || 'Unassigned'}</td>
                                        <td className="px-6 py-4"><StatusBadge status={bug.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default AllBugs;
