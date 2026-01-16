'use client'

interface AgentCardProps {
  name: string
  role: string
  videoSrc: string
  comingSoon?: boolean
  href?: string
}

export function AgentCard({ name, role, videoSrc, comingSoon = false, href }: AgentCardProps) {
  const handleClick = () => {
    if (comingSoon) {
      alert('This feature coming soon')
    }
  }

  const cardContent = (
    <>
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        disablePictureInPicture
        style={{
          pointerEvents: 'none'
        }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      <div className="relative z-10 h-full flex flex-col justify-end p-4">
        <h3 className="text-white font-bold text-lg text-center mb-1">{name}</h3>
        <p className="text-white/90 text-sm text-center">{role}</p>
      </div>
    </>
  )

  if (comingSoon) {
    return (
      <div 
        onClick={handleClick}
        className="rounded-2xl shadow-lg relative overflow-hidden aspect-[3/4] hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer block"
      >
        {cardContent}
      </div>
    )
  }

  // For working agents, use Link (this will be handled by the parent component)
  return (
    <div className="rounded-2xl shadow-lg relative overflow-hidden aspect-[3/4] hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer block">
      {cardContent}
    </div>
  )
}