'use client'

interface PageHeroProps {
  title: string
  subtitle?: string
  description?: string
}

export default function PageHero({ title, subtitle, description }: PageHeroProps) {
  return (
    <section className="pt-20 pb-8 px-4 sm:px-6 text-white relative overflow-hidden bg-gradient-to-b from-[#0a0f1e] via-[#0f172a] to-[#28303E]">
      {/* Half Circle Gradient - Right Side */}
      <div 
        className="absolute top-1/2 -translate-y-1/2 -right-[20%] w-[60%] aspect-square rounded-full opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, rgba(59, 130, 246, 0.2) 40%, rgba(99, 102, 241, 0.1) 60%, transparent 70%)',
        }}
      />
      
      {/* Smaller accent circle */}
      <div 
        className="absolute top-1/3 right-[15%] w-[25%] aspect-square rounded-full opacity-30 pointer-events-none hidden md:block"
        style={{
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.4) 0%, rgba(56, 189, 248, 0.2) 50%, transparent 70%)',
        }}
      />
      
      {/* Decorative blur elements */}
      <div className="absolute top-1/4 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-blue-500/8 rounded-full blur-2xl" />
      
      <div className="container mx-auto relative z-10">
        <div className="min-h-[18vh] flex items-center justify-center">
          <div className="max-w-3xl w-full text-center">
            <div className="space-y-2">
              {/* Main Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                {subtitle ? (
                  <>
                    <span className="text-white">{title} </span>
                    <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                      {subtitle}
                    </span>
                  </>
                ) : (
                  <span className="text-white">{title}</span>
                )}
              </h1>
              
              {/* Description */}
              {description && (
                <p className="text-sm sm:text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Border */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px]">
        <div className="h-full w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      </div>
    </section>
  )
}
