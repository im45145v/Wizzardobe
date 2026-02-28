import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <h1 className="text-5xl font-bold text-gray-900 mb-4">
        Welcome to <span className="text-indigo-600">Wizzardobe</span>
      </h1>
      <p className="text-xl text-gray-500 max-w-2xl mb-8">
        Your AI-powered Personal Outfit Operating System. Reduce decision
        fatigue, optimize wardrobe usage, and intelligently schedule outfits.
      </p>
      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/wardrobe"
          className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          View Wardrobe
        </Link>
      </div>
    </div>
  );
}
