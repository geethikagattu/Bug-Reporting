import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 p-3 my-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <p>{message}</p>
    </div>
  );
};

export default ErrorMessage;
