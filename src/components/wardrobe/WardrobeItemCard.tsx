interface WardrobeItemCardProps {
  id: string;
  name: string;
  category: string;
  dominantColor: string;
  formalityScore: number;
  timesWorn: number;
  lastWornAt: string | null;
  isActive: boolean;
  imageUrl: string | null;
  season: string;
  locationTag: string;
  onToggleActive?: (id: string) => void;
}

export function WardrobeItemCard({
  id,
  name,
  category,
  dominantColor,
  formalityScore,
  timesWorn,
  lastWornAt,
  isActive,
  imageUrl,
  season,
  locationTag,
  onToggleActive,
}: WardrobeItemCardProps) {
  const lastWornText = lastWornAt
    ? `${Math.floor(
        (Date.now() - new Date(lastWornAt).getTime()) / (1000 * 60 * 60 * 24)
      )} days ago`
    : "Never worn";

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
        isActive ? "border-gray-100" : "border-gray-200 opacity-60"
      }`}
    >
      {/* Image or color placeholder */}
      <div
        className="h-40 flex items-center justify-center"
        style={{
          backgroundColor: imageUrl ? undefined : dominantColor,
        }}
      >
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl opacity-50">👕</span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
          {!isActive && (
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
              Inactive
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
            {category}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600">
            {season}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600">
            📍 {locationTag}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
          <div>
            <span className="block text-gray-400">Formality</span>
            <span className="font-medium text-gray-700">
              {formalityScore}/10
            </span>
          </div>
          <div>
            <span className="block text-gray-400">Worn</span>
            <span className="font-medium text-gray-700">
              {timesWorn}× · {lastWornText}
            </span>
          </div>
        </div>

        {onToggleActive && (
          <button
            onClick={() => onToggleActive(id)}
            className={`mt-3 w-full py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isActive
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            }`}
          >
            {isActive ? "Deactivate" : "Reactivate"}
          </button>
        )}
      </div>
    </div>
  );
}
