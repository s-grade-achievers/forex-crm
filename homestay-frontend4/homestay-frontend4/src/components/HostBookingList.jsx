import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { getHostBookings } from '../services/host';

function HostBookingList() {
  const { hostId } = useContext(AppContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!hostId) return;
      setLoading(true);
      try {
        const data = await getHostBookings(hostId);
        setBookings(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [hostId]);

  if (loading) return <div className="text-center p-4">Loading bookings...</div>;
  if (error) return <div className="text-center p-4">Error: {error.message}</div>;

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div key={booking.id} className="bg-white p-4 rounded shadow">
          <p className="text-gray-700">Booking ID: {booking.id}</p>
          <p className="text-gray-700">Room ID: {booking.room_id}</p>
          <p className="text-gray-700">User ID: {booking.user_id}</p>
          <p className="text-gray-700">Start Date: {booking.start_date}</p>
          <p className="text-gray-700">End Date: {booking.end_date}</p>
          <p className="text-gray-700">Status: {booking.status}</p>
        </div>
      ))}
    </div>
  );
}

export default HostBookingList;