import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getHomestay } from '../services/homestay';
import RoomList from '../components/RoomList';

function HomestayDetail() {
  const { id } = useParams();
  const [homestay, setHomestay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomestay = async () => {
      setLoading(true);
      try {
        const data = await getHomestay(id);
        setHomestay(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomestay();
  }, [id]);

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center p-4">Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{homestay?.name}</h1>
      <p className="text-gray-700">{homestay?.location}</p>
      <p className="text-gray-700">{homestay?.description}</p>
      <h2 className="text-2xl font-semibold mt-4">Rooms</h2>
      <RoomList homestayId={id} />
    </div>
  );
}

export default HomestayDetail;