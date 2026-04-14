import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const GithubAuth = () => {
  const [searchParams] = useSearchParams();
  const { githubLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      githubLogin(token);
      window.location.href = '/';
    } else {
      navigate('/login?error=github_auth_failed');
    }
  }, [searchParams, githubLogin, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <LoadingSpinner />
        <h2 className="text-slate-300 mt-4 font-medium animate-pulse">Completing GitHub Authentication...</h2>
    </div>
  );
};

export default GithubAuth;
