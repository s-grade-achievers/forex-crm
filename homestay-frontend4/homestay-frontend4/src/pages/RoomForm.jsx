import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../services/room';

function RoomForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    homestay_id: '',
    type: '',
    beds: '',
    pricing: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to generate availability dates for April and May 2025.
  const generateAvailability = (startStr, endStr) => {
    const availability = {};
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    // Loop from start date to end date (inclusive)
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      // Format date as YYYY-MM-DD
      const formattedDate = d.toISOString().split('T')[0];
      availability[formattedDate] = "available";
    }
    return availability;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Generate availability for April 1, 2025 to May 31, 2025
      const availability = generateAvailability("2025-04-01", "2025-05-31");

      const data = {
        homestay_id: parseInt(formData.homestay_id),
        type: formData.type,
        beds: parseInt(formData.beds),
        pricing: parseFloat(formData.pricing),
        availability, // Automatically generated availability dates
      };
      await createRoom(data);
      alert('Room added successfully');
      navigate('/host');
    } catch (err) {
      setError(err);
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Add New Room</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700">Homestay ID</label>
          <input
            type="number"
            name="homestay_id"
            value={formData.homestay_id}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Room Type</label>
          <input
            type="text"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Beds</label>
          <input
            type="number"
            name="beds"
            value={formData.beds}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700">Pricing</label>
          <input
            type="number"
            name="pricing"
            value={formData.pricing}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Add Room'}
        </button>
        {error && <p className="text-red-500">Error: {error.message}</p>}
      </form>
    </div>
  );
}

export default RoomForm;
