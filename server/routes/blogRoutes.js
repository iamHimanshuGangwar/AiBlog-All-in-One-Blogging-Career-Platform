
import express from 'express'
import { addComment, deleteById, getAllBlogs, getBlogById, getBlogComments, newblog, togglePublish, updateBlog } from '../controllers/blogControllers.js'

import upload from '../middlewares/multer.js'
import auth from '../middlewares/auth.js';

const newRouter=express.Router();
newRouter.post('/blogs',upload.single('image'),auth,newblog)
newRouter.get('/all',getAllBlogs)
newRouter.get('/blog/:blogId',getBlogById)
newRouter.post('/delete',auth,deleteById)
newRouter.post('/toggle-publish',auth,togglePublish)
newRouter.post('/update', upload.single('image'), auth, updateBlog)
newRouter.post('/add-comment',addComment)
newRouter.post('/comments',getBlogComments)
export default newRouter
