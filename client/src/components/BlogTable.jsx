import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { Trash2, Globe, EyeOff, Loader2, Pen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const BlogTable = ({ blog, index, fetchBlogs }) => {
  const { title, createdAt, isPublished, _id } = blog
  const BlogDate = new Date(createdAt)
  const { axios, token } = useAppContext()

  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const navigate = useNavigate()

  const deleteBlogs = async () => {
    const confirm = window.confirm('Are you sure you want to permanently delete this blog?')
    if (!confirm) return

    setIsDeleting(true)
    try {
      const { data } = await axios.post(
        '/api/add/delete',
        { id: _id },
        { headers: { Authorization: token } }
      )
      if (data && data.success) {
        toast.success(data.message || 'Blog deleted successfully')
        await fetchBlogs()
      } else toast.error(data?.message || 'Failed to delete blog')
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to delete blog')
    } finally {
      setIsDeleting(false)
    }
  }

  const togglePublish = async () => {
    setIsToggling(true)
    try {
      const { data } = await axios.post(
        '/api/add/toggle-publish',
        { id: _id },
        { headers: { Authorization: token } }
      )
      if (data && data.success) {
        const status = !isPublished ? 'Published!' : 'Unpublished'
        toast.success(`Blog ${status}`)
        await fetchBlogs()
      } else toast.error(data?.message || 'Failed to toggle blog status')
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to toggle blog status')
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <tr className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors duration-200">
      {/* Index */}
      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">#{index + 1}</td>

      {/* Title */}
      <td className="px-6 py-4">
        <p className="font-medium text-gray-900 dark:text-white line-clamp-1 max-w-xs">{title}</p>
      </td>

      {/* Date */}
      <td className="px-6 py-4 max-sm:hidden">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {BlogDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </td>

      {/* Status Badge */}
      <td className="px-6 py-4 max-sm:hidden">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isPublished
              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
              : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isPublished ? 'bg-green-500' : 'bg-yellow-500'
            }`}
          ></span>
          {isPublished ? 'Live' : 'Draft'}
        </span>
      </td>

      {/* Action Buttons */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Toggle Publish Button */}
          <button
            type="button"
            onClick={togglePublish}
            disabled={isToggling}
            title={isPublished ? 'Unpublish Blog' : 'Publish Blog'}
            className={`p-2 rounded-full shadow-lg text-white transition-transform hover:scale-105 ${
              isPublished
                ? 'bg-gradient-to-r from-green-500 to-green-700'
                : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
            }`}
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPublished ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
          </button>

          {/* Delete Button */}
          <button
            onClick={deleteBlogs}
            disabled={isDeleting}
            title="Delete Blog"
            className="p-2 rounded-full bg-red-600 text-white shadow-lg hover:scale-105 transition-transform"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
          <div className="ml-2">
            <button
              onClick={() => navigate(`/admin/addblog/${_id}`)}
              title="Edit Blog"
              className="p-2 rounded-full bg-indigo-600 text-white shadow-lg hover:scale-105 transition-transform"
              type="button"
            >
              <Pen className="w-4 h-4" />
            </button>
          </div>
      </td>
    </tr>
  )
}

export default BlogTable
