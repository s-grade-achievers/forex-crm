import BookingList from '../components/BookingList';

function BookingListPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Your Bookings</h1>
      <BookingList />
    </div>
  );
}

export default BookingListPage;