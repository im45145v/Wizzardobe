export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">
          Wardrobe usage insights and optimization
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Cost Per Wear
          </h3>
          <p className="text-3xl font-bold text-gray-900">—</p>
          <p className="text-xs text-gray-400 mt-1">Average across all items</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Underused Items
          </h3>
          <p className="text-3xl font-bold text-amber-600">—</p>
          <p className="text-xs text-gray-400 mt-1">
            Items worn fewer than 3 times
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Style Confidence
          </h3>
          <p className="text-3xl font-bold text-green-600">—</p>
          <p className="text-xs text-gray-400 mt-1">
            Average confidence rating
          </p>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Color Distribution
          </h3>
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🎨</p>
            <p className="text-sm">Add items to see color heatmap</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Formality Distribution
          </h3>
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📊</p>
            <p className="text-sm">Add items to see formality chart</p>
          </div>
        </div>
      </div>

      {/* Most & Least Used */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Most Worn Items
          </h3>
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No usage data yet</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Underused Items Alert
          </h3>
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No items to display</p>
          </div>
        </div>
      </div>
    </div>
  );
}
