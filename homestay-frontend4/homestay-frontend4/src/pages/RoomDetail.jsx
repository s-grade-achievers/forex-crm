import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getRoom, getAvailability } from '../services/room';
import BookingForm from '../components/BookingForm';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function RoomDetail() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [errorRoom, setErrorRoom] = useState(null);
  const [errorAvailability, setErrorAvailability] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    const fetchRoom = async () => {
      setLoadingRoom(true);
      try {
        const data = await getRoom(id);
        setRoom(data)
      } catch (err) {
        setErrorRoom(err);
      } finally {
        setLoadingRoom(false);
      }
    };
    fetchRoom();
  }, [id]);

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoadingAvailability(true);
      try {
        const data = await getAvailability(id);
        setAvailability(data);
      } catch (err) {
        setErrorAvailability(err);
      } finally {
        setLoadingAvailability(false);
      }
    };
    fetchAvailability();
  }, [id]);

  if (loadingRoom || loadingAvailability) return <div className="text-center p-4">Loading...</div>;
  if (errorRoom) return <div className="text-center p-4">Error loading room: {errorRoom.message}</div>;
  if (errorAvailability) return <div className="text-center p-4">Error loading availability: {errorAvailability.message}</div>;

  const availableDates = availability
    ? Object.entries(availability)
        .filter(([_, status]) => status === 'available')
        .map(([date]) => new Date(date))
    : [];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{room?.type}</h1>
      <p className="text-gray-700">Beds: {room?.beds}</p>
      <p className="text-gray-700">Price: ${room?.pricing}</p>
      <h2 className="text-2xl font-semibold mt-4">Availability</h2>
      <DatePicker
        selected={startDate}
        onChange={(dates) => {
          const [start, end] = dates;
          setStartDate(start);
          setEndDate(end);
        }}
        startDate={startDate}
        endDate={endDate}
        selectsRange
        inline
        includeDates={availableDates}
        className="mb-4"
      />
      <BookingForm roomId={id} startDate={startDate} endDate={endDate} />
    </div>
  );
}

export default RoomDetail;