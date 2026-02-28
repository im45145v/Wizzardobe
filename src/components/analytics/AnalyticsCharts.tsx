import type { ColorFrequency, FormalityDistribution } from "@/types";

interface AnalyticsChartsProps {
  colorFrequency: ColorFrequency[];
  formalityDistribution: FormalityDistribution[];
}

export function AnalyticsCharts({
  colorFrequency,
  formalityDistribution,
}: AnalyticsChartsProps) {
  const maxColorCount = Math.max(...colorFrequency.map((c) => c.count), 1);
  const maxFormalityCount = Math.max(
    ...formalityDistribution.map((f) => f.count),
    1
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Color Frequency Heatmap */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Color Distribution
        </h3>
        <div className="space-y-3">
          {colorFrequency.slice(0, 10).map((item) => (
            <div key={item.color} className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full border border-gray-200 flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {item.color}
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${(item.count / maxColorCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formality Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Formality Distribution
        </h3>
        <div className="flex items-end gap-2 h-48">
          {formalityDistribution.map((item) => (
            <div
              key={item.score}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span className="text-xs text-gray-500">{item.count}</span>
              <div
                className="w-full bg-indigo-400 rounded-t-md transition-all min-h-[4px]"
                style={{
                  height: `${
                    maxFormalityCount > 0
                      ? (item.count / maxFormalityCount) * 150
                      : 4
                  }px`,
                }}
              />
              <span className="text-xs text-gray-400">{item.score}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400">Casual</span>
          <span className="text-xs text-gray-400">Formal</span>
        </div>
      </div>
    </div>
  );
}
