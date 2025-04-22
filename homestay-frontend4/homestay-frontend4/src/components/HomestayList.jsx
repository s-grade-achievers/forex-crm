import { useState, useEffect } from 'react';
import { getHomestays } from '../services/homestay';
import { Link } from 'react-router-dom';

function HomestayList() {
  const [homestays, setHomestays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomestays = async () => {
      setLoading(true);
      try {
        const data = await getHomestays();
        setHomestays(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomestays();
  }, []);

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center p-4">Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Homestay List</h1>

      {/* Table header */}
      <div className="grid grid-cols-3 font-semibold border-b border-gray-300 pb-2 mb-2">
        <div>Name</div>
        <div>Location</div>
        <div>Description</div>
      </div>

      {/* Homestay entries */}
      {homestays.map((homestay) => (
        <Link to={`/homestays/${homestay.id}`} key={homestay.id}>
          <div className="grid grid-cols-3 gap-4 p-2 border-b hover:bg-gray-50 transition">
            <div className="text-blue-600 font-medium">{homestay.name}</div>
            <div>{homestay.location}</div>
            <div className="truncate">{homestay.description}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default HomestayList;
