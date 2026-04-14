import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import ErrorMessage from '../../components/ErrorMessage';
import { Loader2, Send } from 'lucide-react';
import ClassificationBadge from '../../components/ClassificationBadge';

const SubmitBug = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [projectId, setProjectId] = useState('');
    
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    useEffect(() => {
        api.get('/projects').then(res => {
            setProjects(res.data);
            if(res.data.length > 0) setProjectId(res.data[0]._id);
        }).catch(err => console.error(err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await api.post('/bugs', { title, description, priority, projectId });
            
            // Wait briefly for ML pipeline side-effects to complete in DB via a quick generic poll or optimistic UI.
            // Since our backend async pipeline might take a second, we query the exact bug instance to show the ML classification inline.
            setTimeout(async () => {
                try {
                    const checkRes = await api.get(`/bugs/${res.data._id}`);
                    setResult({
                        id: res.data._id,
                        classification: checkRes.data.classificationResult,
                        status: checkRes.data.status
                    });
                } catch(e) {}
                setLoading(false);
            }, 2000);
            
        } catch (err) {
            setError('Failed to submit bug report');
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Report a New Bug</h1>
                <p className="text-slate-400 mb-8">Submit details to be analyzed and triaged automatically by AI.</p>

                <div className="bg-surface border border-slate-700/50 rounded-2xl p-8 shadow-xl">
                    <ErrorMessage message={error} />
                    
                    {result ? (
                        <div className="text-center py-6">
                            <div className="mb-6 flex justify-center">
                               {result.classification && <ClassificationBadge isValid={result.classification.result === 'Valid Bug'} confidence={result.classification.confidenceScore} />}
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Bug Reported Successfully</h3>
                            <p className="text-slate-400 mb-6">Your bug has been processed by our ML system. Status is now <span className="font-semibold text-slate-300">{result.status}</span>.</p>
                            
                            <div className="flex justify-center gap-4">
                                <button onClick={() => window.location.href=`/bugs/${result.id}`} className="px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-blue-600 transition-colors">View Bug Details</button>
                                <button onClick={() => {setTitle(''); setDescription(''); setResult(null);}} className="px-6 py-2.5 bg-slate-800 text-white font-medium rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">Submit Another</button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Project</label>
                                <select required value={projectId} onChange={e=>setProjectId(e.target.value)} className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                                    <option value="" disabled>Select a project</option>
                                    {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Bug Title</label>
                                <input type="text" required value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="E.g. App crashes when clicking submit button..."/>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Detailed Description</label>
                                <textarea required rows="5" value={description} onChange={e=>setDescription(e.target.value)} className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none" placeholder="Provide steps to reproduce, expected behavior, and actual behavior..."></textarea>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {['Low', 'Medium', 'High', 'Critical'].map(p => (
                                        <div 
                                          key={p} 
                                          onClick={() => setPriority(p)}
                                          className={`cursor-pointer text-center py-2.5 rounded-lg border text-sm font-medium transition-all ${priority === p ? 'border-primary bg-primary/10 text-primary' : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-500'}`}
                                        >
                                            {p}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full py-3.5 bg-primary hover:bg-blue-600 text-white font-medium rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-75">
                                {loading ? <><Loader2 className="w-5 h-5 animate-spin"/> Processing with AI...</> : <><Send className="w-4 h-4"/> Submit Report</>}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default SubmitBug;
