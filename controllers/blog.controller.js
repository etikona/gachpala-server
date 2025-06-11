import { createBlog, getAllBlogs, getBlogById } from "../models/blog.model.js";
import { getCommentsByBlog } from "../models/comment.model.js";

const createBlog = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const blog = await createBlog({ title, content, category });
    res.status(201).json(blog);
  } catch (err) {
    res.status(500).json({ msg: "Error creating blog", error: err.message });
  }
};

const blogList = async (req, res) => {
  try {
    const { search, category } = req.query;
    const blogs = await getAllBlogs(search, category);
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching blogs", error: err.message });
  }
};

const blogDetails = async (req, res) => {
  try {
    const blog = await getBlogById(req.params.id);
    if (!blog) return res.status(404).json({ msg: "Blog is not found" });

    const comments = await getCommentsByBlog(blog.id);
    res.json({ ...blog, comments });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching blog", error: err.message });
  }
};

export default { createBlog, blogDetails, blogList };
