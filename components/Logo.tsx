import Link from 'next/link'

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
      <div className="relative">
        {/* Globe icon */}
        <svg className="w-10 h-10 text-white" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M20 2 L20 38 M2 20 L38 20" stroke="currentColor" strokeWidth="1.5"/>
          <ellipse cx="20" cy="20" rx="18" ry="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <ellipse cx="20" cy="20" rx="6" ry="18" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        </svg>
        {/* Wave W shape integrated */}
        <svg className="absolute -right-2 top-1/2 -translate-y-1/2 w-8 h-8 text-white" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 16 L8 8 L12 20 L16 4 L20 24 L24 12 L28 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-white">DataW</span>
        <span className="text-xs text-white/80 uppercase tracking-wider">Data Gathering Platform</span>
      </div>
    </Link>
  )
}

