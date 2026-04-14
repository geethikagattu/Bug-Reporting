import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';

const AssignmentLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/assignments').then(res => {
            setLogs(res.data);
            setLoading(false);
        }).catch(err => setLoading(false));
    }, []);

    return (
        <Layout>
            <div className="mb-6"><h1 className="text-3xl font-bold text-white tracking-tight">Assignment Logs</h1></div>
            <div className="bg-surface border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
                {loading ? <LoadingSpinner /> : (
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="bg-slate-900/50 uppercase text-xs text-slate-400">
                            <tr><th className="px-6 py-4">Bug ID</th><th className="px-6 py-4">Bug Title</th><th className="px-6 py-4">Developer</th><th className="px-6 py-4">Assigned By</th><th className="px-6 py-4">Date</th></tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log._id} className="border-b border-slate-700/50">
                                    <td className="px-6 py-4 font-mono text-xs">{log.bug?._id.slice(-6).toUpperCase()}</td>
                                    <td className="px-6 py-4 font-medium text-white">{log.bug?.title}</td>
                                    <td className="px-6 py-4 text-emerald-400">{log.developer?.name}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-800 rounded font-medium">{log.assignedBy}</span></td>
                                    <td className="px-6 py-4 text-xs text-slate-500">{new Date(log.assignedAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </Layout>
    );
};

export default AssignmentLogs;
