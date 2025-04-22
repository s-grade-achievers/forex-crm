import { useState, useEffect } from 'react';
import { getRooms } from '../services/room';
import { Link } from 'react-router-dom';

function RoomList({ homestayId }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const data = await getRooms(homestayId);
        setRooms(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [homestayId]);

  if (loading) return <div className="text-center p-4">Loading rooms...</div>;
  if (error) return <div className="text-center p-4">Error: {error.message}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {rooms.map((room) => (
        <Link to={`/rooms/${room.id}`} key={room.id}>
          <div className="bg-white p-4 rounded shadow hover:shadow-lg transition">
            <h3 className="text-xl font-bold text-blue-600">{room.type}</h3>
            <p className="text-gray-600">Beds: {room.beds}</p>
            <p className="text-gray-600">Price: ${room.pricing}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default RoomList;