import { StatCard } from "@/components/common/StatCard";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Your wardrobe at a glance
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Items"
          value="—"
          icon="👕"
          subtitle="Across all locations"
        />
        <StatCard
          title="Active Items"
          value="—"
          icon="✅"
          subtitle="Available for outfits"
        />
        <StatCard
          title="Outfits Generated"
          value="—"
          icon="✨"
          subtitle="This month"
        />
        <StatCard
          title="Avg Confidence"
          value="—"
          icon="💪"
          subtitle="Based on ratings"
        />
      </div>

      {/* Today's Outfit */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Today&apos;s Recommended Outfit
        </h2>
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-4">👔</p>
          <p className="text-lg font-medium">No outfit generated yet</p>
          <p className="text-sm mt-2">
            Add items to your wardrobe and generate your first outfit
          </p>
        </div>
      </div>

      {/* 14-Day Schedule Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          14-Day Schedule
        </h2>
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-4">📅</p>
          <p className="text-lg font-medium">Schedule not generated</p>
          <p className="text-sm mt-2">
            Generate outfits to see your 14-day forecast
          </p>
        </div>
      </div>
    </div>
  );
}
