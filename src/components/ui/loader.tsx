import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="loader">
      {/* You can customize this spinner as needed */}
      <div className="spinner"></div>
      <style>
        {`
          .loader {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100px; /* Adjust height as needed */
          }
          .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Loader;