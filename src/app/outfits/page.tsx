export default function OutfitsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Outfits</h1>
          <p className="text-gray-500 mt-1">
            AI-generated outfit combinations
          </p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          Generate Outfit
        </button>
      </div>

      {/* Generation Pipeline Visualization */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          How It Works
        </h2>
        <div className="flex items-center gap-4 overflow-x-auto py-2">
          {[
            { step: "1", label: "Filter", desc: "Active & location items" },
            { step: "2", label: "Score", desc: "Recency & formality match" },
            { step: "3", label: "Combine", desc: "Valid outfit combos" },
            { step: "4", label: "Rank", desc: "Top 5 deterministic" },
            { step: "5", label: "AI Refine", desc: "Aesthetic re-ranking" },
          ].map(({ step, label, desc }) => (
            <div
              key={step}
              className="flex-shrink-0 flex flex-col items-center text-center w-32"
            >
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm mb-2">
                {step}
              </div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      <div className="text-center py-16 text-gray-400">
        <p className="text-6xl mb-4">✨</p>
        <p className="text-xl font-medium text-gray-600">
          No outfits generated yet
        </p>
        <p className="text-sm mt-2 text-gray-400">
          Add wardrobe items first, then generate AI-powered outfit combinations
        </p>
      </div>
    </div>
  );
}
