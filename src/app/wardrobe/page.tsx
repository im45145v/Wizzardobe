import Link from "next/link";

export default function WardrobePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wardrobe</h1>
          <p className="text-gray-500 mt-1">
            Manage your clothing items
          </p>
        </div>
        <Link
          href="/wardrobe/add"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          + Add Item
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3">
        {["All", "Tops", "Bottoms", "Shoes", "Accessories", "Watches"].map(
          (filter) => (
            <button
              key={filter}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {filter}
            </button>
          )
        )}
      </div>

      {/* Empty State */}
      <div className="text-center py-16 text-gray-400">
        <p className="text-6xl mb-4">🗄️</p>
        <p className="text-xl font-medium text-gray-600">
          Your wardrobe is empty
        </p>
        <p className="text-sm mt-2 text-gray-400">
          Start by adding your clothing items with photos
        </p>
        <Link
          href="/wardrobe/add"
          className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Add Your First Item
        </Link>
      </div>
    </div>
  );
}
