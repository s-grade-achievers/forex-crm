import { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

function CustomerDashboard() {
  const { customerId } = useContext(AppContext);
  const navigate = useNavigate();

  if (!customerId) {
    return <div className="text-center p-4">Please log in as a customer.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Customer Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Book Homestay</h2>
          <Link to="/homestays" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 block text-center">
            View Homestays
          </Link>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-2">My Bookings</h2>
          <Link to="/bookings" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700 block text-center">
            View Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;