import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

function HomePage() {
  const { setRole, setCustomerId, setHostId } = useContext(AppContext);
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [isNew, setIsNew] = useState(null);
  const [uidInput, setUidInput] = useState('');

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setIsNew(null);
  };

  const handleNew = () => {
    setIsNew(true);
    if (selectedRole === 'customer') {
      // Generate a random UID for customer (simulating incremental for demo)
      const newUid = Math.floor(Math.random() * 100); // Simple random UID
      setCustomerId(newUid);
      setRole('customer');
      navigate('/customer');
    } else if (selectedRole === 'host') {
      navigate('/host/register');
    }
  };

  const handleExisting = () => {
    setIsNew(false);
  };

  const handleUidSubmit = () => {
    if (selectedRole === 'customer') {
      setCustomerId(parseInt(uidInput));
      setRole('customer');
      navigate('/customer');
    } else if (selectedRole === 'host') {
      setHostId(parseInt(uidInput));
      setRole('host');
      navigate('/host');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Welcome to Homestay Management</h1>
      <div className="space-x-4 mb-4">
        <button
          onClick={() => handleRoleSelect('customer')}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Customer
        </button>
        <button
          onClick={() => handleRoleSelect('host')}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Host
        </button>
      </div>
      {selectedRole && (
        <div className="mt-4">
          <h2 className="text-2xl font-semibold mb-2">Are you a new or existing {selectedRole}?</h2>
          <div className="space-x-4">
            <button
              onClick={handleNew}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              New
            </button>
            <button
              onClick={handleExisting}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Existing
            </button>
          </div>
        </div>
      )}
      {selectedRole && isNew === false && (
        <div className="mt-4">
          <h2 className="text-2xl font-semibold mb-2">Enter your {selectedRole} UID</h2>
          <input
            type="number"
            value={uidInput}
            onChange={(e) => setUidInput(e.target.value)}
            className="p-2 border rounded"
            placeholder="Enter UID"
          />
          <button
            onClick={handleUidSubmit}
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}

export default HomePage;