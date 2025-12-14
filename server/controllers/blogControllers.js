
import fs, { read } from 'fs'

// import { format } from 'path';
import Model from '../models/Blog.js';
// import ImageKit from '../configs/imagekit.js'
// import imagekit from '../configs/imagekit.js';
import imagekit from '../configs/imagekit.js';
import { json } from 'stream/consumers';
import Comment from '../models/Comment.js';
import { notifySubscribers } from './subscriberController.js';
const getImagekitInstance = () => imagekit;
export const newblog = async (req, res) => {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    try {
        const {
            title, subTitle, description,
            category, language, isPublished
        } = req.body;
        const imageFile = req.file;
        //check if the feilds are present

        if (!title || !description || !category || !imageFile) {
            console.log("Validation failed:", { title, description, category, imageFile });
            return res.json({ success: false, message: "missig the required fields" })
        }
        const fileBuffer = fs.readFileSync(imageFile.path)
        // console.log("ImageKit methods:", Object.keys(imagekit));
        console.log("Upload payload:", {
            fileType: typeof fileBuffer,
            fileName: imageFile.originalname,
            folder: "NewBlogs"
        });
        const imagekit = getImagekitInstance();
        if (!imagekit) {
            return res.status(500).json({ success: false, message: "ImageKit not configured" })
        }
        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: imageFile.originalname,
            folder: "NewBlogs"
        })
        //optimize the image url transformation

        const optimizationofImage = imagekit.url({
            path: response.filePath,
            transformation: [{ quality: 'auto' },//auto compression
            { format: 'webp' }, //convert to modern format
            { width: '1080' }  //width reszing
            ]
        })
                const image = optimizationofImage;

                const created = await Model.create({ title, subTitle, description, category, language, image, isPublished });

                // If published immediately, notify subscribers (best-effort)
                if (String(isPublished) === 'true' || isPublished === true) {
                    try {
                        await notifySubscribers(created);
                    } catch (notifyErr) {
                        console.warn('Failed to notify subscribers:', notifyErr?.message || notifyErr);
                    }
                }

                res.status(201).json({ success: true, message: "Blog added successfully" })

    } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, message: error.message })
    }
}
export const getAllBlogs = async (req, res) => {
    try {
        const blogs = await Model.find({ isPublished: true })
        res.json({ success: true, blogs })
    }
    catch (error) {
        res.json({ success: false, message: error.message })
    }
}
export const getBlogById = async (req, res) => {
    try {
        const { blogId } = req.params;
        const blog = await Model.findById(blogId)
        if (!blog) {
            return res.json({ success: false, message: "Blog not found" })
        }
        res.json({ success: true, blog })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}
export const deleteById = async (req, res) => {
    try {
        const { id } = req.body
        await Model.findByIdAndDelete(id);
        //Delete all comment associated with the blog;

        await Comment.deleteMany({ blog: id })
        res.json({ success: true, message: "Blog Deleted successfully" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const togglePublish = async (req, res) => {
    try {
        const { id } = req.body;
        const blog = await Model.findById(id);
        blog.isPublished = !blog.isPublished;
        await blog.save();
        // If the blog was just published, notify subscribers
        if (blog.isPublished) {
          try { await notifySubscribers(blog); } catch (e) { console.warn('Notify on toggle failed', e?.message || e); }
        }
        res.json({ success: true, blog })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const updateBlog = async (req, res) => {
    try {
        const { id, title, subTitle, description, category, language, isPublished } = req.body;
        if (!id) return res.status(400).json({ success: false, message: 'Blog id is required' });

        const blog = await Model.findById(id);
        if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

        // Update basic fields
        if (title !== undefined) blog.title = title;
        if (subTitle !== undefined) blog.subTitle = subTitle;
        if (description !== undefined) blog.description = description;
        if (category !== undefined) blog.category = category;
        if (language !== undefined) blog.language = language;
        if (isPublished !== undefined) blog.isPublished = (String(isPublished) === 'true' || isPublished === true);

        // If a new image file is uploaded, upload to imagekit and replace
        if (req.file) {
            const fileBuffer = fs.readFileSync(req.file.path);
            const imagekit = getImagekitInstance();
            if (!imagekit) return res.status(500).json({ success: false, message: 'ImageKit not configured' });
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: req.file.originalname,
                folder: 'NewBlogs'
            });
            const optimizationofImage = imagekit.url({ path: response.filePath, transformation: [{ quality: 'auto' }, { format: 'webp' }, { width: '1080' }] });
            blog.image = optimizationofImage;
        }

        const wasPublishedBefore = blog.isPublished;
        await blog.save();

        // If it was changed to published now, notify subscribers
        if (!wasPublishedBefore && blog.isPublished) {
            try { await notifySubscribers(blog); } catch (e) { console.warn('Notify on update failed', e?.message || e); }
        }

        res.json({ success: true, message: 'Blog updated successfully', blog });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
}


export const addComment = async (req, res) => {
    try {
        const { blog, name, content } = req.body;
        await Comment.create({ blog, name, content });
        res.json({ success: true, message: "Comment added successfully" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const getBlogComments = async (req, res) => {
    try {
        const { blogId } = req.body;
        const comment = await Comment.find({ blog: blogId, isApproved: true })
        .sort({ createdAt: -1 });
        res.json({ success: true, comment})
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}