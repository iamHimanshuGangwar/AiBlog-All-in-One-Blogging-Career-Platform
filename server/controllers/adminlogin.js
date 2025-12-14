import jwt from "jsonwebtoken";
import Model from "../models/Blog.js";
import Comment from "../models/Comment.js";
export const adminLogin = async (req, res) => {

    try {
        const { email, password } = req.body;
        if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
            return res.json({ success: false, message: 'Invalid Credentials' })
        }
        const jwttoken = jwt.sign({
            id: "admin",
            email: email,
            isAdmin: true
        }, process.env.JWT_SECRET, { expiresIn: '6h' });
        
        res.json({ 
            success: true, 
            token: jwttoken,
            user: {
                name: 'Admin',
                lastname: '',
                email: email,
                isAdmin: true
            }
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const getAllBlogsAdmin = async (req, res) => {
    try {
        // const adminId=req.user._id;
        const blogs = await Model.find({ }).sort({ createdAt: -1 });
        res.json({ success: true, blogs })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const getAllComments = async (req, res) => {
    try {
        const comments = await Comment.find({}).populate("blog").sort({ createdAt: -1 });
        res.json({ success: true, comments })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
export const getDashboard = async (req, res) => {
    try {
        const recentBlogs = await Model.find({}).sort({ createdAt: -1 }).limit(10);
        const blogs = await Model.countDocuments();
        const comments = await Comment.countDocuments()
        const drafts = await Model.countDocuments({ isPublished: false })
        const dashboard = {
            blogs, comments, drafts, recentBlogs
        }
        res.json({ success: true, dashboard })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
export const deleteCommentById = async (req, res) => {
    try {
        const { id } = req.body;
        await Comment.findByIdAndDelete(id);
        res.json({ success: true, message: "Comment deleted Successfully" })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
export const approvedCommentById = async (req, res) => {
    try {
        const { id } = req.body;
        await Comment.findByIdAndUpdate(id, { isApproved: true });
        res.json({ success: true, message: "Comment approved Successfully" })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}