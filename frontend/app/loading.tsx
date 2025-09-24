// app/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        {/* Animated BlockShield Logo/Icon */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-muted rounded-lg flex items-center justify-center bg-card">
            <div className="w-8 h-8 bg-primary rounded animate-pulse"></div>
          </div>
          {/* Scanning animation ring */}
          <div className="absolute inset-0 w-16 h-16 border-2 border-transparent border-t-primary rounded-lg animate-spin"></div>
        </div>

        {/* Loading text */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">BlockShield</h2>
          <p className="text-muted-foreground">Initializing threat detection...</p>
        </div>

        {/* Animated progress dots */}
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>

        {/* Security scanning effect */}
        <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-transparent via-primary to-transparent w-1/3 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}