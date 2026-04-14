import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
  </div>
);

export default LoadingSpinner;
