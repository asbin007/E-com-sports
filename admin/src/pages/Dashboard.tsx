const Dashboard = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
            Total Revenue
          </h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">$0.00</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
            Orders
          </h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
            Products
          </h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">-</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
