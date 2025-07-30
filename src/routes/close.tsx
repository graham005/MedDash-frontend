import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/close')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-blue-900 dark:text-blue-200">
          Payment Complete
        </h1>
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          You can now close this page.
        </p>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => window.close()}
        >
          Close Page
        </button>
      </div>
    </div>
  )
}
