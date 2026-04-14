import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', repositoryUrl: ''});

    const load = () => {
        api.get('/admin/projects').then(res => {
            setProjects(res.data);
            setLoading(false);
        });
    };
    useEffect(load, []);

    const submit = async (e) => {
        e.preventDefault();
        await api.post('/projects', formData);
        setAdding(false);
        load();
    };

    return (
        <Layout>
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white tracking-tight">Manage Projects</h1>
                <button onClick={()=>setAdding(!adding)} className="px-4 py-2 bg-primary text-white rounded-lg">Add Project</button>
            </div>
            {adding && (
                <div className="bg-surface border border-slate-700/50 rounded-xl p-6 mb-6 shadow-xl">
                    <form onSubmit={submit} className="space-y-4">
                        <input className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none" placeholder="Project Name" onChange={e=>setFormData({...formData, name: e.target.value})} />
                        <textarea className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none" placeholder="Description" onChange={e=>setFormData({...formData, description: e.target.value})} />
                        <input className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none" placeholder="Repository URL" onChange={e=>setFormData({...formData, repositoryUrl: e.target.value})} />
                        <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium">Save Project</button>
                    </form>
                </div>
            )}
            <div className="grid md:grid-cols-2 gap-6">
                {loading ? <LoadingSpinner /> : projects.map(p => (
                    <div key={p._id} className="bg-surface border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-xl font-bold text-white tracking-tight">{p.name}</h3>
                        <p className="text-sm text-slate-400 mt-2">{p.description}</p>
                        <p className="text-xs text-blue-400 mt-4 font-mono">{p.repositoryUrl}</p>
                    </div>
                ))}
            </div>
        </Layout>
    );
};
export default Projects;
