import { useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import HostHomestayList from '../components/HostHomestayList';
import HostBookingList from '../components/HostBookingList';

function HostDashboard() {
  const { hostId } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!hostId) {
      navigate('/host/register');
    }
  }, [hostId, navigate]);

  if (!hostId) {
    return <div className="text-center p-4">Redirecting to registration...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Host Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">View My Homestays</h2>
          <HostHomestayList />
          <Link to="/host/homestays/new" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 block text-center">
            Create New Homestay
          </Link>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-2">View Bookings</h2>
          <HostBookingList />
        </div>
      </div>
      <Link to="/host/rooms/new" className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 block text-center">
        Add Rooms
      </Link>
    </div>
  );
}

export default HostDashboard;