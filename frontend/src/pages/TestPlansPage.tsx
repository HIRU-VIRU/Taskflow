import React from 'react';

const TestPlansPage: React.FC = () => {
  console.log('TestPlansPage: Rendering...');

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900">Test Plans Page</h1>
      <p className="text-gray-600 mt-2">If you can see this, the routing is working!</p>

      <div className="mt-4 p-4 bg-blue-50 rounded">
        <p>Backend Status: Testing...</p>
      </div>

      <button
        onClick={() => {
          console.log('Button clicked!');
          fetch('http://localhost:3000/api/health')
            .then(r => r.json())
            .then(data => {
              console.log('Health check:', data);
              alert('Backend health: ' + data.data.status);
            })
            .catch(err => {
              console.error('Health check failed:', err);
              alert('Backend error: ' + err.message);
            });
        }}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Test Backend Connection
      </button>
    </div>
  );
};

export default TestPlansPage;