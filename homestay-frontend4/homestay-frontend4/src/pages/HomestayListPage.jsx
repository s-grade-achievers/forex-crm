import HomestayList from '../components/HomestayList';

function HomestayListPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Available Homestays</h1>
      <HomestayList />
    </div>
  );
}

export default HomestayListPage;