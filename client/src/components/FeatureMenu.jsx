import React, { useState } from 'react'
import { X, FileText, Image as ImageIcon, Zap, Briefcase, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const FeatureMenu = ({ blogTitle, blogContent }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeFeature, setActiveFeature] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const { user } = useAppContext()
  const { openLogin } = useAuth()
  const navigate = useNavigate()

  const features = [
    {
      id: 'resume',
      name: 'Resume Builder',
      icon: FileText,
      description: 'Create a professional resume',
    },
    {
      id: 'summarize',
      name: 'Text Summarization',
      icon: Zap,
      description: 'Summarize blog content instantly',
    },
    {
      id: 'imageGen',
      name: 'Image Generation',
      icon: ImageIcon,
      description: 'Generate AI images for content',
    },
    {
      id: 'jobs',
      name: 'Jobs',
      icon: Briefcase,
      description: 'Find jobs and manage applications',
    },
    {
      id: 'blog',
      name: 'Blog',
      icon: BookOpen,
      description: 'Create and browse blog posts',
    },
  ]

  const handleSummarize = () => {
    if (!blogContent) return toast.error('No blog content to summarize')
    setIsGenerating(true)
    setTimeout(() => {
      const plainText = blogContent.replace(/<[^>]+>/g, '')
      const sentences = plainText.split(/[.!?]+/).filter(s => s.trim())
      const summary = sentences.slice(0, Math.ceil(sentences.length / 3)).join('. ') + '.'
      toast.success('Summary generated!')
      setIsGenerating(false)
      alert(`Summary of "${blogTitle}":\n\n${summary}`)
    }, 1500)
  }

  const handleResumeBuilder = () => {
    if (!user) {
      toast.error('Please login to access Resume Builder')
      openLogin()
      return
    }
    toast.loading('Opening Resume Builder...')
    setTimeout(() => {
      navigate('/resume-builder')
      setIsOpen(false)
      toast.dismiss()
    }, 1000)
  }

  const handleImageGen = () => {
    if (!user) {
      toast.error('Please login to access Image Generator')
      openLogin()
      return
    }
    if (!blogTitle) return toast.error('Please provide a blog title for image generation')
    setIsGenerating(true)
    toast.loading('Generating image...')
    setTimeout(() => {
      navigate('/image-generator')
      setIsOpen(false)
      toast.dismiss()
      setIsGenerating(false)
    }, 2000)
  }

  const handleJobs = () => {
    if (!user) {
      toast.error('Please login to access Jobs')
      openLogin()
      return
    }
    toast.loading('Opening Jobs...')
    setTimeout(() => {
      navigate('/jobs')
      setIsOpen(false)
      toast.dismiss()
    }, 800)
  }

  const handleBlog = () => {
    if (!user) {
      toast.error('Please login to access Blog')
      openLogin()
      return
    }
    toast.loading('Opening Blog...')
    setTimeout(() => {
      navigate('/blogs')
      setIsOpen(false)
      toast.dismiss()
    }, 800)
  }

  const handleFeature = (id) => {
    setActiveFeature(id)
    switch (id) {
      case 'resume': return handleResumeBuilder()
      case 'summarize': return handleSummarize()
      case 'imageGen': return handleImageGen()
      case 'jobs': return handleJobs()
      case 'blog': return handleBlog()
      default: toast.error('Feature not available')
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-lg flex items-center justify-center
                     bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white hover:scale-110 transition-transform z-40"
          title="Open AI Features"
        >
          <Zap className="w-6 h-6" />
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in">
            
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Features</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enhance your blog content with AI tools</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Features */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {features.map(feature => {
                const Icon = feature.icon
                return (
                  <button
                    key={feature.id}
                    onClick={() => handleFeature(feature.id)}
                    disabled={isGenerating && activeFeature === feature.id}
                    className={`group relative p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-left 
                      hover:scale-105 hover:shadow-xl disabled:opacity-50 transition-transform duration-300
                      bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white`}
                  >
                    <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-lg bg-white/20 group-hover:bg-white/30 text-white">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{feature.name}</h3>
                    <p className="text-sm">{feature.description}</p>
                    {isGenerating && activeFeature === feature.id && (
                      <div className="mt-3 flex items-center gap-2 text-white text-sm">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        Processing...
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 rounded-full font-medium border border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                Close
              </button>
              <button
                onClick={() => toast.success('More features coming soon!')}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-medium hover:scale-105 transition-transform"
              >
                Explore More
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default FeatureMenu
