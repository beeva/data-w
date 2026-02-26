'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'
import { getOpenProjects } from '@/lib/services/projectService'
import type { Project } from '@/types/project'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Calendar, 
  DollarSign, 
  Users, 
  MapPin, 
  Clock, 
  Search,
  Loader2,
  FolderKanban,
  ArrowRight,
  Camera,
  Video,
  Mic,
  FileText,
  BarChart3,
  MapPinned,
  Cpu,
  MoreHorizontal,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Globe,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  LogIn,
  Target,
  TrendingUp,
  Coins,
} from 'lucide-react'
import PageHero from './PageHero'

export default function Projects() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [applying, setApplying] = useState(false)
  const [showApplicationSuccessDialog, setShowApplicationSuccessDialog] = useState(false)
  
  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [budgetRange, setBudgetRange] = useState<{ min: number; max: number }>({ min: 0, max: 100000 })
  const [sortBy, setSortBy] = useState<'newest' | 'budget_high' | 'budget_low' | 'deadline'>('newest')
  
  // Expand/collapse filter sections
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    dataTypes: true,
    location: true,
    budget: true,
  })

  const categories = ['Photography', 'Video', 'Audio', 'Text', 'Survey', 'Location Data', 'Sensor Data', 'Other']
  const dataTypes = ['Images', 'Videos', 'Audio Files', 'Documents', 'GPS Data', 'Sensor Readings', 'Survey Responses']
  const locationTypes = ['Remote / Worldwide', 'United States', 'Europe', 'Asia', 'Africa', 'South America', 'Australia']

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Photography': return Camera
      case 'Video': return Video
      case 'Audio': return Mic
      case 'Text': return FileText
      case 'Survey': return BarChart3
      case 'Location Data': return MapPinned
      case 'Sensor Data': return Cpu
      default: return MoreHorizontal
    }
  }

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        const { data, error: fetchError } = await getOpenProjects()
        if (fetchError) throw fetchError
        setProjects(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load projects')
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    )
  }

  const toggleDataType = (dataType: string) => {
    setSelectedDataTypes(prev => 
      prev.includes(dataType) ? prev.filter(d => d !== dataType) : [...prev, dataType]
    )
  }

  const toggleLocation = (location: string) => {
    setSelectedLocations(prev => 
      prev.includes(location) ? prev.filter(l => l !== location) : [...prev, location]
    )
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedDataTypes([])
    setSelectedLocations([])
    setBudgetRange({ min: 0, max: 100000 })
    setSearchQuery('')
  }

  const filteredProjects = projects
    .filter(project => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Category filter
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(project.category)
      
      // Budget filter
      const matchesBudget = project.budget >= budgetRange.min && project.budget <= budgetRange.max
      
      // Location filter (simplified - checks if project has location or is worldwide)
      const matchesLocation = selectedLocations.length === 0 || 
        selectedLocations.includes('Remote / Worldwide') ||
        (project.location?.address && selectedLocations.some(loc => 
          project.location?.address?.toLowerCase().includes(loc.toLowerCase())
        ))
      
      return matchesSearch && matchesCategory && matchesBudget && matchesLocation
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'budget_high': return b.budget - a.budget
        case 'budget_low': return a.budget - b.budget
        case 'deadline': 
          if (!a.deadline) return 1
          if (!b.deadline) return -1
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No deadline'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(dateString)
  }

  const getDaysLeft = (deadline: string | null) => {
    if (!deadline) return null
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const activeFiltersCount = selectedCategories.length + selectedDataTypes.length + selectedLocations.length + 
    (budgetRange.min > 0 || budgetRange.max < 100000 ? 1 : 0)

  const handleApplyClick = (project: Project) => {
    setSelectedProject(project)
    setSheetOpen(true)
  }

  const handleApplyToProject = async () => {
    if (!user) {
      router.push('/login?redirect=/projects')
      return
    }
    
    setApplying(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setApplying(false)
    setSheetOpen(false)
    // TODO: Implement actual project application logic
    setShowApplicationSuccessDialog(true)
  }

  // Mock progress data for the selected project
  const getProjectProgress = (project: Project) => {
    const totalNeeded = project.max_collectors || 10
    const current = Math.floor(Math.random() * totalNeeded * 0.7) // Mock current collectors
    const submissions = Math.floor(Math.random() * 500) // Mock submissions
    const validated = Math.floor(submissions * 0.8) // Mock validated
    return { totalNeeded, current, submissions, validated }
  }

  const FilterSidebar = () => (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="rounded-xl border border-cyan-400/30 overflow-hidden">
        <button 
          onClick={() => toggleSection('category')}
          className="w-full flex items-center justify-between p-4 hover:bg-cyan-400/5"
        >
          <span className="font-semibold text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-cyan-400" />
            Category
          </span>
          {expandedSections.category ? <ChevronUp className="w-4 h-4 text-cyan-400/50" /> : <ChevronDown className="w-4 h-4 text-cyan-400/50" />}
        </button>
        {expandedSections.category && (
          <div className="px-4 pb-4 space-y-2">
            {categories.map(category => (
              <label key={category} className="flex items-center gap-3 cursor-pointer group">
                <Checkbox 
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => toggleCategory(category)}
                  className="border-cyan-400/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                />
                <span className="text-sm text-white/70 group-hover:text-cyan-400">{category}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Data Types Filter */}
      <div className="rounded-xl border border-cyan-400/30 overflow-hidden">
        <button 
          onClick={() => toggleSection('dataTypes')}
          className="w-full flex items-center justify-between p-4 hover:bg-cyan-400/5"
        >
          <span className="font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            Data Types
          </span>
          {expandedSections.dataTypes ? <ChevronUp className="w-4 h-4 text-cyan-400/50" /> : <ChevronDown className="w-4 h-4 text-cyan-400/50" />}
        </button>
        {expandedSections.dataTypes && (
          <div className="px-4 pb-4 space-y-2">
            {dataTypes.map(dataType => (
              <label key={dataType} className="flex items-center gap-3 cursor-pointer group">
                <Checkbox 
                  checked={selectedDataTypes.includes(dataType)}
                  onCheckedChange={() => toggleDataType(dataType)}
                  className="border-cyan-400/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                />
                <span className="text-sm text-white/70 group-hover:text-cyan-400">{dataType}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Location Filter */}
      <div className="rounded-xl border border-cyan-400/30 overflow-hidden">
        <button 
          onClick={() => toggleSection('location')}
          className="w-full flex items-center justify-between p-4 hover:bg-cyan-400/5"
        >
          <span className="font-semibold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Location
          </span>
          {expandedSections.location ? <ChevronUp className="w-4 h-4 text-cyan-400/50" /> : <ChevronDown className="w-4 h-4 text-cyan-400/50" />}
        </button>
        {expandedSections.location && (
          <div className="px-4 pb-4 space-y-2">
            {locationTypes.map(location => (
              <label key={location} className="flex items-center gap-3 cursor-pointer group">
                <Checkbox 
                  checked={selectedLocations.includes(location)}
                  onCheckedChange={() => toggleLocation(location)}
                  className="border-cyan-400/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                />
                <span className="text-sm text-white/70 group-hover:text-cyan-400">{location}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Budget Filter */}
      <div className="rounded-xl border border-cyan-400/30 overflow-hidden">
        <button 
          onClick={() => toggleSection('budget')}
          className="w-full flex items-center justify-between p-4 hover:bg-cyan-400/5"
        >
          <span className="font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            Budget
          </span>
          {expandedSections.budget ? <ChevronUp className="w-4 h-4 text-cyan-400/50" /> : <ChevronDown className="w-4 h-4 text-cyan-400/50" />}
        </button>
        {expandedSections.budget && (
          <div className="px-4 pb-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-xs text-cyan-400/70 mb-1 block">Min</label>
                <input
                  type="number"
                  value={budgetRange.min}
                  onChange={(e) => setBudgetRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-cyan-400/30 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 bg-transparent"
                  placeholder="0"
                />
              </div>
              <span className="text-cyan-400/30 mt-5">—</span>
              <div className="flex-1">
                <label className="text-xs text-cyan-400/70 mb-1 block">Max</label>
                <input
                  type="number"
                  value={budgetRange.max}
                  onChange={(e) => setBudgetRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-cyan-400/30 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 bg-transparent"
                  placeholder="100000"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button 
          variant="outline" 
          onClick={clearAllFilters}
          className="w-full border-cyan-400/50 text-cyan-400 hover:text-white hover:bg-cyan-400/10"
        >
          <X className="w-4 h-4 mr-2" />
          Clear All Filters ({activeFiltersCount})
        </Button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#28303E]">
      <Header />
      
      <PageHero 
        title="Find Projects"
        subtitle="and Start Earning"
        description={`Browse ${projects.length} open data collection projects and contribute quality data`}
      />

      <main className="pb-20 pt-8">
        {/* Search Bar */}
        <div className="container mx-auto px-6 mb-6">
          <div className="flex flex-col md:flex-row gap-3 max-w-3xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for projects by title, description, or keywords..."
                className="w-full px-4 py-3.5 pl-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
            <Button 
              className="md:hidden bg-white/10 border border-white/20 text-white"
              onClick={() => setShowMobileFilters(true)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </div>
        </div>
        <div className="container mx-auto px-6">
          <div className="flex gap-6">
            {/* Sidebar Filters - Desktop */}
            <div className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24">
                <FilterSidebar />
              </div>
            </div>

            {/* Mobile Filters Modal */}
            {showMobileFilters && (
              <div className="fixed inset-0 bg-black/80 z-50 lg:hidden">
                <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[#0B1020] p-6 overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Filters</h2>
                    <button onClick={() => setShowMobileFilters(false)} className="text-white/60 hover:text-white">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <FilterSidebar />
                </div>
              </div>
            )}

            {/* Projects List */}
            <div className="flex-1 min-w-0">
              {/* Sort and Results Count */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/60 text-sm">
                  <span className="text-white font-semibold">{filteredProjects.length}</span> projects found
                </p>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 bg-[#0f172a] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="newest" className="bg-[#0f172a] text-white">Newest First</option>
                  <option value="budget_high" className="bg-[#0f172a] text-white">Budget: High to Low</option>
                  <option value="budget_low" className="bg-[#0f172a] text-white">Budget: Low to High</option>
                  <option value="deadline" className="bg-[#0f172a] text-white">Deadline: Soonest</option>
                </select>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-20 bg-white/5 rounded-xl border border-red-500/30">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              {/* Projects */}
              {!loading && !error && (
                <>
                  {filteredProjects.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
                      <FolderKanban className="w-16 h-16 text-white/20 mx-auto mb-4" />
                      <p className="text-white/60 text-lg mb-2">No projects match your criteria</p>
                      <p className="text-white/40 text-sm mb-4">Try adjusting your filters or search query</p>
                      <Button onClick={clearAllFilters} className="bg-slate-700 border border-slate-600 text-white hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredProjects.map((project) => {
                        const CategoryIcon = getCategoryIcon(project.category)
                        const daysLeft = getDaysLeft(project.deadline)
                        const isUrgent = daysLeft !== null && daysLeft <= 3
                        
                        return (
                          <div
                            key={project.id}
                            className="group bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5 hover:border-cyan-500/50 hover:bg-white/[0.07] transition-all duration-300"
                          >
                            {/* Top Row */}
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-white/40">{getTimeAgo(project.created_at)}</span>
                                  {isUrgent && (
                                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Urgent
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                                  {project.title}
                                </h3>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xl font-bold text-emerald-400">${project.budget.toLocaleString()}</p>
                                <p className="text-xs text-white/40">Budget</p>
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-white/60 text-sm mb-4 line-clamp-2">
                              {project.description}
                            </p>

                            {/* Tags Row */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                                <CategoryIcon className="w-3 h-3 mr-1" />
                                {project.category}
                              </Badge>
                              {project.requirements.data_types.slice(0, 3).map((type, idx) => (
                                <Badge key={idx} variant="outline" className="border-cyan-400/30 text-cyan-300/80 text-xs">
                                  {type}
                                </Badge>
                              ))}
                              {project.requirements.data_types.length > 3 && (
                                <Badge variant="outline" className="border-cyan-400/30 text-cyan-300/80 text-xs">
                                  +{project.requirements.data_types.length - 3} more
                                </Badge>
                              )}
                            </div>

                            {/* Bottom Row */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                              <div className="flex items-center gap-4 text-sm text-white/50">
                                <div className="flex items-center gap-1.5">
                                  <Users className="w-4 h-4" />
                                  <span>{project.max_collectors} collectors needed</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4" />
                                  <span>Due {formatDate(project.deadline)}</span>
                                </div>
                                {project.location?.address ? (
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" />
                                    <span className="truncate max-w-[150px]">{project.location.address.split(',')[0]}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <Globe className="w-4 h-4" />
                                    <span>Remote</span>
                                  </div>
                                )}
                              </div>
                              <Button 
                                size="sm" 
                                className="bg-slate-700 border border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                                onClick={() => handleApplyClick(project)}
                              >
                                Apply Now
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <div className="bg-[#0F131A] rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-3">Need data collected for your project?</h2>
              <p className="text-white/60 mb-6 max-w-xl mx-auto">
                Post your project and get access to our global network of verified data collectors.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link href="/signup?role=requester">
                  <Button size="lg" className="bg-slate-700 border border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                    Post a Project
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Project Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl bg-[#0B1020] border-white/10 overflow-y-auto p-0">
          {selectedProject && (
            <div className="flex flex-col h-full">
              <SheetHeader className="border-b border-white/10 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                    {(() => {
                      const CategoryIcon = getCategoryIcon(selectedProject.category)
                      return <CategoryIcon className="w-7 h-7 text-cyan-400" />
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-white text-xl leading-tight">
                      {selectedProject.title}
                    </SheetTitle>
                    <SheetDescription className="text-white/50 mt-1.5 text-sm">
                      Posted {getTimeAgo(selectedProject.created_at)}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Budget & Deadline */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      Budget
                    </div>
                    <p className="text-2xl font-bold text-emerald-400">${selectedProject.budget.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Deadline
                    </div>
                    <p className="text-lg font-semibold text-white">{formatDate(selectedProject.deadline)}</p>
                    {getDaysLeft(selectedProject.deadline) !== null && (
                      <p className={`text-xs ${getDaysLeft(selectedProject.deadline)! <= 7 ? 'text-orange-400' : 'text-white/50'}`}>
                        {getDaysLeft(selectedProject.deadline)} days left
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress Section */}
                {(() => {
                  const progress = getProjectProgress(selectedProject)
                  const progressPercent = (progress.current / progress.totalNeeded) * 100
                  return (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                        Project Progress
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-white/60">Collectors</span>
                            <span className="text-white font-medium">{progress.current} / {progress.totalNeeded}</span>
                          </div>
                          <Progress value={progressPercent} className="h-2 bg-white/10" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-white">{progress.submissions}</p>
                            <p className="text-xs text-white/50">Total Submissions</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-400">{progress.validated}</p>
                            <p className="text-xs text-white/50">Validated</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Description */}
                <div>
                  <h4 className="text-white font-medium mb-2">Description</h4>
                  <p className="text-white/60 text-sm leading-relaxed">{selectedProject.description}</p>
                </div>

                {/* Requirements */}
                <div>
                  <h4 className="text-white font-medium mb-3">Requirements</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Target className="w-4 h-4 text-cyan-400 mt-0.5" />
                      <div>
                        <p className="text-white text-sm">Data Types</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedProject.requirements.data_types.map((type, idx) => (
                            <Badge key={idx} variant="outline" className="border-cyan-400/30 text-cyan-300/80 text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="w-4 h-4 text-cyan-400 mt-0.5" />
                      <div>
                        <p className="text-white text-sm">Collectors Needed</p>
                        <p className="text-white/60 text-xs">{selectedProject.max_collectors} collectors</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-cyan-400 mt-0.5" />
                      <div>
                        <p className="text-white text-sm">Location</p>
                        <p className="text-white/60 text-xs">
                          {selectedProject.location?.address || 'Remote / Worldwide'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Earnings Estimate */}
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-white font-medium">Estimated Earnings</h4>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    ${Math.floor(selectedProject.budget / (selectedProject.max_collectors || 10)).toLocaleString()}
                    <span className="text-sm font-normal text-white/50"> per collector</span>
                  </p>
                  <p className="text-xs text-white/50 mt-1">Based on equal distribution among collectors</p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="sticky bottom-0 bg-[#0B1020] border-t border-white/10 p-6 mt-auto">
                {!user && !authLoading ? (
                  <div className="space-y-4">
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-orange-400 font-semibold">Sign in required</p>
                        <p className="text-white/60 text-sm mt-0.5">You need to sign in to apply for this project</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Link href="/login?redirect=/projects">
                        <Button size="lg" className="w-full bg-slate-700 border border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] text-white">
                          <LogIn className="w-4 h-4 mr-2" />
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/signup?role=collector">
                        <Button size="lg" className="w-full bg-white/10 border border-white/30 text-white hover:bg-white/20">
                          Create Account
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <Button 
                    size="lg"
                    className="w-full bg-slate-700 border border-slate-600 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                    onClick={handleApplyToProject}
                    disabled={applying}
                  >
                    {applying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Apply to Project
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <ConfirmationDialog
        open={showApplicationSuccessDialog}
        onOpenChange={setShowApplicationSuccessDialog}
        title="Application submitted"
        description="Your application was submitted successfully."
        confirmText="OK"
        hideCancel
        onConfirm={async () => {
          setShowApplicationSuccessDialog(false)
        }}
      />
    </div>
  )
}
