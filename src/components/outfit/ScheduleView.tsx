import type { ScheduleEntry } from "@/types";

interface ScheduleViewProps {
  schedule: ScheduleEntry[];
}

export function ScheduleView({ schedule }: ScheduleViewProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        14-Day Forecast
      </h2>
      <div className="space-y-3">
        {schedule.map((entry) => {
          const date = new Date(entry.date);
          const dayName = date.toLocaleDateString("en-US", {
            weekday: "short",
          });
          const dateStr = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          const isToday =
            entry.date === new Date().toISOString().split("T")[0];

          return (
            <div
              key={entry.date}
              className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                isToday
                  ? "bg-indigo-50 border border-indigo-200"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="w-16 text-center">
                <p className="text-xs text-gray-400 uppercase">{dayName}</p>
                <p
                  className={`text-sm font-semibold ${
                    isToday ? "text-indigo-600" : "text-gray-900"
                  }`}
                >
                  {dateStr}
                </p>
              </div>

              <div className="flex-1">
                {entry.outfit ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.outfit.items.map((item) => (
                      <span
                        key={item.itemId}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {item.category}:{" "}
                        <span className="ml-1 text-gray-500">
                          {item.dominantColor}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    No outfit planned
                  </p>
                )}
              </div>

              {entry.eventTitle && (
                <div className="text-right">
                  <p className="text-xs text-indigo-600 font-medium">
                    {entry.eventTitle}
                  </p>
                  {entry.eventFormality && (
                    <p className="text-xs text-gray-400">
                      Formality: {entry.eventFormality}/10
                    </p>
                  )}
                </div>
              )}

              {entry.isLocked && (
                <span className="text-sm" title="Locked">
                  🔒
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
