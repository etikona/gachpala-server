import {
  createBlog,
  getAllBlogs,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
} from "../models/blog.model.js";
// import { getCommentsByBlog } from "../models/comment.model
// .js";

// *Current data
// {
//   "title": "The Ultimate Guide to Indoor Plant Care",
//   "content": "Learn how to keep your indoor plants thriving with these expert tips and tricks.",
//   "category": "plant care",
//   "excerpt": "Indroor plant care guide",
//   "image": "/assets/blog1.jpg",
//   "tags": ["indoor plants", "care tips", "beginners"],
//   "author": "John Doe"
// }

// !Expected data
// {
//       id: "1",
//       title: "The Ultimate Guide to Indoor Plant Care",
//       slug: "ultimate-guide-indoor-plant-care",
//       excerpt:
//         "Learn how to keep your indoor plants thriving with these expert tips and tricks.",
//       status: "published",
//       author: "Admin User",
//       date: "2023-10-15",
//       views: 1245,
//       category: "Plant Care",
//       tags: ["indoor plants", "care tips", "beginners"],
//       image: "/assets/blog1.jpg",
//     },
// CREATE
export const create = async (req, res) => {
  try {
    const { title, content, category, excerpt, image, tags, author } = req.body;
    const blog = await createBlog({
      title,
      content,
      category,
      excerpt,
      image,
      tags,
      author,
    });
    res.status(201).json(blog);
  } catch (err) {
    res.status(500).json({ msg: "Error creating blog", error: err.message });
  }
};

// READ ALL
export const list = async (req, res) => {
  try {
    const { search, category, tag } = req.query;
    const blogs = await getAllBlogs(search, category, tag);
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching blogs", error: err.message });
  }
};

// READ SINGLE (by ID or slug)
export const details = async (req, res) => {
  try {
    const identifier = req.params.id;
    const blog = isNaN(identifier)
      ? await getBlogBySlug(identifier)
      : await getBlogById(identifier);

    if (!blog) return res.status(404).json({ msg: "Blog not found" });

    // const comments = await getCommentsByBlog(blog.id);
    res.json({ ...blog });
  } catch (err) {
    res.status(500).json({ msg: "Error fetching blog", error: err.message });
  }
};

// UPDATE
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedBlog = await updateBlog(id, updates);
    res.json(updatedBlog);
  } catch (err) {
    res.status(500).json({ msg: "Error updating blog", error: err.message });
  }
};

// DELETE
export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteBlog(id);
    res.json({ msg: "Blog deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting blog", error: err.message });
  }
};
