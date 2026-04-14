import React from 'react';
import Layout from '../../components/Layout';

const Reports = () => {
    return (
        <Layout>
            <div className="mb-6"><h1 className="text-3xl font-bold text-white tracking-tight">System Reports</h1></div>
            <div className="bg-surface border border-slate-700/50 rounded-2xl shadow-xl p-8 text-center text-slate-400">
                <p>Filter constraints: Report Type, Date Range, Project ID</p>
                <button className="mt-4 px-6 py-2 bg-primary text-white font-medium rounded-lg">Generate CSV</button>
            </div>
        </Layout>
    );
}

export default Reports;
