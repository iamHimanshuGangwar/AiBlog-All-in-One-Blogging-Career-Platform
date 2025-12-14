import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './Pages/Home'
import Blog from './Pages/Blog'
import BlogList from './components/Bloglist'
import Navbar from './components/Navbar'
import Layout from './Pages/admin/Layout'
import AddBlog from './Pages/admin/AddBlog'
import DashBoard from './Pages/admin/DashBoard'
import ListBlog from './Pages/admin/ListBlog'
import Comment from './Pages/admin/Comment'
import Login from './Pages/admin/Login'
import ImageGenerator from './Pages/admin/imageGenerate'
import JobApplications from './Pages/admin/JobApplications'
import PostJob from './Pages/admin/PostJob'
import ResumeBuilder from './Pages/ResumeBuilder'
import JobSearch from './Pages/JobSearch'
import 'quill/dist/quill.snow.css'
import { Toaster } from 'react-hot-toast'
import { useAppContext } from './context/AppContext'

// Protected Route
const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) return <Login />
  return children
}

const App = () => {
  const { token } = useAppContext();

  return (
    <div>
      <Toaster />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/resume-builder" element={<><Navbar /><ResumeBuilder /></>} />
        <Route path="/image-generator" element={<><Navbar /><ImageGenerator /></>} />
        <Route path="/blogs" element={<><Navbar /><BlogList /></>} />
        <Route path="/blog/:id" element={<Blog />} />
        <Route path="/jobs" element={<><Navbar /><JobSearch /></>} />

        {/* Login */}
        <Route
          path="/admin/login"
          element={token ? <Layout /> : <Login />}
        />

        {/* Admin Protected */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute isAuthenticated={token}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashBoard />} />
          <Route path="addblog/:id" element={<AddBlog />} />
          <Route path="addblog" element={<AddBlog />} />
          <Route path="listblog" element={<ListBlog />} />
          <Route path="comment" element={<Comment />} />
          <Route path="image-gen" element={<ImageGenerator />} />
          <Route path="job-applications" element={<JobApplications />} />
          <Route path="post-job" element={<PostJob />} />
        </Route>

      </Routes>
    </div>
  )
}

export default App
