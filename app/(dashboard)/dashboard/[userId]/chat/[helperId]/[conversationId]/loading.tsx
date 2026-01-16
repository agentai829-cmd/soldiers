'use client'

export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <style jsx>{`
          .custom-loader {
            width: 60px;
            aspect-ratio: 1;
            border: 15px solid #ddd;
            border-radius: 50%;
            position: relative;
            transform: rotate(45deg);
            margin: 0 auto 1rem;
          }
          .custom-loader::before {
            content: "";
            position: absolute;
            inset: -15px;
            border-radius: 50%;
            border: 15px solid #514b82;
            animation: l18 2s infinite linear;
          }
          @keyframes l18 {
            0%   {clip-path:polygon(50% 50%,0 0,0    0,0    0   ,0    0   ,0    0   )}
            25%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 0   ,100% 0   ,100% 0   )}
            50%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,100% 100%,100% 100%)}
            75%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0    100%,0    100%)}
            100% {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0    100%,0    0   )}
          }
        `}</style>
        <div className="custom-loader"></div>
        <p className="text-sm text-gray-500">Loading your workspaces</p>
        <p className="text-xs text-gray-400 mt-1">Please wait while we fetch your data...</p>
      </div>
    </div>
  )
}
