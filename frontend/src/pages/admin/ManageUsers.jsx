import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = () => {
        api.get('/admin/users').then(res => {
            setUsers(res.data);
            setLoading(false);
        }).catch(err => setLoading(false));
    }
    
    useEffect(() => fetchUsers(), []);

    const deleteUser = async (id) => {
        if(!window.confirm('Delete user?')) return;
        try {
            await api.delete(`/admin/users/${id}`);
            fetchUsers();
        } catch(e) {}
    }

    return (
        <Layout>
            <div className="mb-6"><h1 className="text-3xl font-bold text-white tracking-tight">Manage Users</h1></div>
            <div className="bg-surface border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
                {loading ? <LoadingSpinner /> : (
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="bg-slate-900/50 uppercase text-xs text-slate-400">
                            <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Role</th><th className="px-6 py-4 text-right">Action</th></tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id} className="border-b border-slate-700/50 hover:bg-slate-800/20">
                                    <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                                    <td className="px-6 py-4">{u.email}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-800 rounded text-xs">{u.role}</span></td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={()=>deleteUser(u._id)} className="text-red-400 hover:text-red-300 font-medium">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </Layout>
    );
};

export default ManageUsers;
