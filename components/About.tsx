'use client'

import Link from 'next/link'
import Image from 'next/image'
import Header from './Header'
import Footer from './Footer'
import PageHero from './PageHero'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Target,
  Users,
  Globe,
  Shield,
  Zap,
  Heart,
  Award,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Linkedin,
  Twitter,
  Mail,
  Building2,
  Lightbulb,
  Handshake,
  Scale,
  Eye,
} from 'lucide-react'

export default function About() {
  const stats = [
    { value: '50K+', label: 'Data Collectors', icon: Users },
    { value: '120+', label: 'Countries', icon: Globe },
    { value: '10M+', label: 'Data Points Collected', icon: TrendingUp },
    { value: '99.2%', label: 'Validation Accuracy', icon: Shield },
  ]

  const values = [
    {
      icon: Globe,
      title: 'Global Inclusion',
      description: 'We believe everyone deserves access to economic opportunities, regardless of location or banking status.',
    },
    {
      icon: Shield,
      title: 'Data Quality',
      description: 'We maintain the highest standards for data collection, validation, and delivery to our clients.',
    },
    {
      icon: Scale,
      title: 'Fair Compensation',
      description: 'Contributors are paid fairly for their work, with transparent pricing and instant crypto payments.',
    },
    {
      icon: Eye,
      title: 'Transparency',
      description: 'Every transaction, validation, and payment is recorded on-chain for full accountability.',
    },
  ]

  const timeline = [
    {
      year: '2023',
      title: 'The Beginning',
      description: 'DataW was founded with a mission to democratize data collection and create economic opportunities globally.',
    },
    {
      year: '2024',
      title: 'Platform Launch',
      description: 'Launched our beta platform with 1,000 data collectors across 30 countries.',
    },
    {
      year: '2025',
      title: 'DTW Token',
      description: 'Introduced DTW token for instant, borderless payments to our global contributor network.',
    },
    {
      year: '2026',
      title: 'Global Expansion',
      description: 'Reached 50,000+ collectors in 120+ countries with enterprise-grade data solutions.',
    },
  ]

  const team = [
    {
      name: 'Sarah Chen',
      role: 'CEO & Co-Founder',
      image: '/avatars/female.jpg',
      bio: 'Former ML lead at Google. Stanford CS PhD. Passionate about ethical AI.',
      linkedin: '#',
      twitter: '#',
    },
    {
      name: 'Michael Roberts',
      role: 'CTO & Co-Founder',
      image: '/avatars/man1.jpg',
      bio: '15+ years in distributed systems. Ex-Amazon. Blockchain enthusiast.',
      linkedin: '#',
      twitter: '#',
    },
    {
      name: 'David Park',
      role: 'Head of Operations',
      image: '/avatars/man2.jpg',
      bio: 'Operations expert with experience scaling startups from 10 to 10,000.',
      linkedin: '#',
      twitter: '#',
    },
  ]

  const partners = [
    'Stanford AI Lab',
    'MIT Media Lab',
    'OpenAI',
    'Anthropic',
    'Google Research',
    'Microsoft AI',
  ]

  return (
    <div className="min-h-screen bg-[#28303E]">
      <Header />
      
      <PageHero 
        title="About"
        subtitle="DataW"
        description="We're building the world's most accessible data collection platform, empowering people everywhere to contribute to AI development."
      />

      <main className="pb-20 pt-8">
        <div className="container mx-auto px-6">
          
          {/* Mission Section */}
          <div className="mb-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Our Mission</Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Democratizing Data Collection for the AI Era
                </h2>
                <div className="space-y-4 text-white/70 leading-relaxed">
                  <p>
                    The AI revolution needs data — diverse, high-quality, ethically-sourced data from around the world. 
                    But traditional data collection excludes billions of potential contributors who lack access to 
                    banking systems or live in underserved regions.
                  </p>
                  <p>
                    DataW changes this. We've built a platform where anyone with a smartphone can contribute valuable 
                    data and get paid instantly through cryptocurrency, regardless of where they live or their 
                    banking status.
                  </p>
                  <p>
                    Our mission is to create economic opportunities for people worldwide while helping organizations 
                    build better, more representative AI systems.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="bg-[#0F131A] rounded-2xl p-8 border border-white/10">
                  <div className="grid grid-cols-2 gap-6">
                    {stats.map((stat, idx) => (
                      <div key={idx} className="text-center p-4">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                          <stat.icon className="w-6 h-6 text-cyan-400" />
                        </div>
                        <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                        <p className="text-white/60 text-sm">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30">How It Works</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Connecting Data Needs with Global Contributors
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Our platform bridges the gap between organizations that need data and people who can provide it.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Requesters Post Projects</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Companies and researchers define their data needs, set budgets, and specify quality requirements 
                  for their AI training datasets.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Collectors Contribute Data</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Our global network of contributors collects images, audio, text, and other data types 
                  according to project specifications.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">AI Validates & Pays</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Our AI-powered validation system checks data quality. Approved submissions trigger 
                  instant crypto payments to collectors.
                </p>
              </div>
            </div>
          </div>

          {/* Our Values */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-purple-500/20 text-purple-400 border-purple-500/30">Our Values</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                What We Stand For
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, idx) => (
                <div 
                  key={value.title}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-cyan-500/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-all">
                    <value.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Our Story Timeline */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">Our Journey</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                The DataW Story
              </h2>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-white/10 hidden md:block" />
              
              <div className="space-y-8">
                {timeline.map((item, idx) => (
                  <div key={item.year} className={`relative flex items-center ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    <div className={`w-full md:w-1/2 ${idx % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                        <Badge className="mb-2 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">{item.year}</Badge>
                        <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                        <p className="text-white/60 text-sm">{item.description}</p>
                      </div>
                    </div>
                    {/* Timeline dot */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-cyan-500 border-4 border-[#0B1020] hidden md:block" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">Our Team</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Meet the People Behind DataW
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                A passionate team of engineers, researchers, and operators building the future of data collection.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {team.map((member) => (
                <div 
                  key={member.name}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 text-center hover:border-cyan-500/50 transition-all group"
                >
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="rounded-full object-cover"
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{member.name}</h3>
                  <p className="text-cyan-400 text-sm mb-3">{member.role}</p>
                  <p className="text-white/60 text-sm mb-4">{member.bio}</p>
                  <div className="flex items-center justify-center gap-3">
                    <a href={member.linkedin} className="text-white/40 hover:text-cyan-400 transition-colors">
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a href={member.twitter} className="text-white/40 hover:text-cyan-400 transition-colors">
                      <Twitter className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Partners Section */}
          <div className="mb-20">
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-white/10 text-white/70 border-white/20">Trusted By</Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Our Partners & Clients
              </h2>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {partners.map((partner) => (
                <div 
                  key={partner}
                  className="px-6 py-3 bg-white/5 rounded-lg border border-white/10 text-white/60 font-medium hover:text-white hover:border-white/30 transition-all"
                >
                  {partner}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="mb-16">
            <div className="bg-[#0F131A] rounded-2xl border border-white/10 p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Get In Touch</Badge>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    Want to Learn More?
                  </h2>
                  <p className="text-white/60 mb-6">
                    Whether you're a company looking for data solutions or someone interested in becoming a contributor, 
                    we'd love to hear from you.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-white/70">
                      <Mail className="w-5 h-5 text-cyan-400" />
                      <span>hello@dataw.io</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/70">
                      <Building2 className="w-5 h-5 text-cyan-400" />
                      <span>San Francisco, CA & Remote</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/signup?role=requester" className="flex-1">
                    <Button size="lg" className="w-full bg-slate-700 border border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                      Post a Project
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/signup?role=collector" className="flex-1">
                    <Button size="lg" className="w-full bg-slate-700 border border-slate-600 text-white hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                      Become a Collector
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}
