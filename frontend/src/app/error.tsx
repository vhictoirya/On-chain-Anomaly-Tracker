'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <h2 className="text-4xl font-bold mb-4">Something went wrong!</h2>
      <button
        className="px-4 py-2 mt-4 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  )
}