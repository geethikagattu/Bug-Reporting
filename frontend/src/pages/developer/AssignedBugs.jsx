import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';

const AssignedBugs = () => {
    const [bugs, setBugs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/developer/bugs').then(res => {
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
                    <h1 className="text-3xl font-bold text-white tracking-tight">Assigned Bugs</h1>
                    <p className="text-slate-400 mt-1">Issues intelligently routed to you based on expertise.</p>
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
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bugs.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-8 text-slate-500">No bugs currently assigned to you.</td></tr>
                                ) : bugs.map(bug => (
                                    <tr key={bug._id} onClick={() => window.location.href=`/bugs/${bug._id}`} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors cursor-pointer">
                                        <td className="px-6 py-4 font-medium text-slate-200">{bug.title}</td>
                                        <td className="px-6 py-4 text-slate-400">{bug.project?.name || '-'}</td>
                                        <td className="px-6 py-4"><span className="text-slate-400">{bug.status}</span></td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-primary text-xs font-semibold uppercase tracking-wider hover:underline">View Source & Solve</span>
                                        </td>
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

export default AssignedBugs;
