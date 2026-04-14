import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import ClassificationBadge from '../../components/ClassificationBadge';
import { useAuth } from '../../context/AuthContext';
import { Clock, FileCode, CheckCircle2 } from 'lucide-react';

const BugDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [bug, setBug] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(false);

    useEffect(() => {
        fetchBug();
    }, [id]);

    const fetchBug = async () => {
        try {
            const endpoint = user.role === 'Developer' ? `/developer/bugs/${id}` : `/bugs/${id}`;
            const res = await api.get(endpoint);
            setBug(res.data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.msg || 'Could not load bug details');
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!newStatus) return;
        setStatusUpdating(true);
        try {
            const endpoint = user.role === 'Developer' ? `/developer/bugs/${id}/status` : `/bugs/${id}/status`;
            await api.put(endpoint, { status: newStatus });
            await fetchBug();
        } catch(e) {
            alert('Failed to update status');
        }
        setStatusUpdating(false);
    };

    if (loading) return <Layout><LoadingSpinner /></Layout>;
    if (error) return <Layout><ErrorMessage message={error} /></Layout>;
    if (!bug) return null;

    return (
        <Layout>
            {/* Header Area */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-slate-500 font-mono text-sm">#{bug._id.slice(-6).toUpperCase()}</span>
                        <StatusBadge status={bug.status} />
                        <PriorityBadge priority={bug.priority} />
                        {bug.classificationResult && (
                            <ClassificationBadge 
                                isValid={bug.classificationResult.result === 'Valid Bug'} 
                                confidence={bug.classificationResult.confidenceScore} 
                            />
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">{bug.title}</h1>
                    <p className="text-slate-400 mt-2">Reported by {bug.reporter?.name} in <span className="font-semibold text-slate-300">{bug.project?.name}</span></p>
                </div>

                {/* Status Actions (Developer or Admin) */}
                {(user.role === 'Developer' || user.role === 'Admin') && (
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-slate-400 font-medium">Update Status:</label>
                        <select 
                            disabled={statusUpdating}
                            value={bug.status}
                            onChange={(e) => handleStatusUpdate(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 outline-none focus:border-primary disabled:opacity-50"
                        >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Main Content Column */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-surface border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
                        <div className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">
                            {bug.description}
                        </div>
                    </div>

                    {/* Localization Panel (Highlight for Developers) */}
                    {(user.role === 'Developer' || user.role === 'Admin') && bug.localizationFiles?.length > 0 && (
                        <div className="bg-surface border border-primary/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                            <div className="flex items-center gap-2 mb-4">
                                <FileCode className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold text-white">AI Localized Files</h3>
                            </div>
                            <p className="text-sm text-slate-400 mb-4">The ML model has flagged these source files as the most likely locations for this bug.</p>
                            
                            <div className="space-y-3">
                                {bug.localizationFiles.map((file, idx) => (
                                    <div key={file._id} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                        <span className="font-mono text-sm text-blue-400 break-all">{file.fileName}</span>
                                        <div className="flex items-center gap-3 min-w-32 justify-end">
                                            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(file.relevanceScore * 100, 100)}%` }} />
                                            </div>
                                            <span className="text-xs text-slate-400">{Math.round(file.relevanceScore * 100)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Assignment details */}
                    <div className="bg-surface border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Assignment</h3>
                        <div className="flex items-center gap-3 text-sm">
                            {bug.assignedTo ? (
                                <>
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                                        {bug.assignedTo.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{bug.assignedTo.name}</p>
                                        <p className="text-slate-500 text-xs">Developer</p>
                                    </div>
                                </>
                            ) : (
                                <span className="text-slate-500">Unassigned</span>
                            )}
                        </div>
                    </div>

                    {/* History Log */}
                    <div className="bg-surface border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-4 h-4"/> Activity Log
                        </h3>
                        <div className="space-y-4">
                            {bug.historyLog?.map((log, index) => (
                                <div key={index} className="flex gap-3 relative">
                                    {index !== bug.historyLog.length - 1 && (
                                        <div className="absolute top-6 left-[11px] bottom-[-16px] w-[2px] bg-slate-700/50 z-0"/>
                                    )}
                                    <div className="relative z-10 w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center shrink-0">
                                        <div className="w-2 h-2 rounded-full bg-slate-400"/>
                                    </div>
                                    <div className="flex-1 pb-1">
                                        <p className="text-sm text-white font-medium">{log.status}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{log.comment}</p>
                                        <p className="text-[10px] text-slate-500 mt-1">{new Date(log.updatedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default BugDetail;
