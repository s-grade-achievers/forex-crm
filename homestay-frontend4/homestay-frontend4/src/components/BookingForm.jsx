import { useState } from 'react';
import { createBooking } from '../services/booking';
import { useNavigate } from 'react-router-dom';

function BookingForm({ roomId, startDate, endDate }) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert('Please select dates');
      return;
    }
    setSubmitting(true);
    try {
      const bookingData = {
        room_id: roomId,
        user_id: 1, // Fixed user ID for simplicity
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'confirmed',
      };
      await createBooking(bookingData);
      alert('Booking created successfully');
      navigate('/bookings');
    } catch (err) {
      setError(err);
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        disabled={submitting}
      >
        {submitting ? 'Booking...' : 'Book Now'}
      </button>
      {error && <p className="text-red-500 mt-2">Error: {error.message}</p>}
    </form>
  );
}

export default BookingForm;