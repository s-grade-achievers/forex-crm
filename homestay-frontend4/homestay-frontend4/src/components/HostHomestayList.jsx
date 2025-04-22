import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { getHostHomestays } from '../services/host';
import { Link } from 'react-router-dom';

function HostHomestayList() {
  const { hostId } = useContext(AppContext);
  const [homestays, setHomestays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHomestays = async () => {
      if (!hostId) return;
      setLoading(true);
      try {
        const data = await getHostHomestays(hostId);
        setHomestays(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomestays();
  }, [hostId]);

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center p-4">Error: {error.message}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {homestays.map((homestay) => (
        <Link to={`/homestays/${homestay.id}`} key={homestay.id}>
          <div className="bg-white p-4 rounded shadow hover:shadow-lg transition">
            <h3 className="text-xl font-bold text-blue-600">{homestay.name}</h3>
            <p className="text-gray-600">{homestay.location}</p>
            <p className="text-gray-600 truncate">{homestay.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default HostHomestayList;