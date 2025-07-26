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

//New CREATE

export const create = async (req, res) => {
  try {
    // Extract text fields from request body
    const {
      title,
      slug,
      content,
      category,
      excerpt,
      tags,
      author,
      publishDate,
    } = req.body;

    // Handle uploaded image
    const image = req.file ? `/uploads/blogs/${req.file.filename}` : null;

    // Parse tags into array
    let tagsArray = [];
    if (tags) {
      if (typeof tags === "string") {
        try {
          // Try parsing as JSON array
          tagsArray = JSON.parse(tags);
        } catch {
          // Fallback to comma-separated string
          tagsArray = tags.split(",").map((tag) => tag.trim());
        }
      } else if (Array.isArray(tags)) {
        tagsArray = tags;
      }
    }

    // Create blog with all fields
    const blog = await createBlog({
      title,
      slug,
      content,
      category,
      excerpt,
      image,
      tags: tagsArray,
      author,
      publish_date: publishDate || new Date().toISOString().split("T")[0],
    });

    res.status(201).json(blog);
  } catch (err) {
    // Handle Multer errors
    if (err.message && err.message.includes("Only image files are allowed")) {
      return res.status(400).json({ msg: err.message });
    }

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ msg: "File too large. Max size is 5MB." });
    }

    // Handle database errors
    if (err.code === "23505") {
      // Unique constraint violation
      return res.status(400).json({ msg: "Slug must be unique" });
    }

    res.status(500).json({
      msg: "Error creating blog",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};
// CREATE
// export const create = async (req, res) => {
//   try {
//     const { title, content, category, excerpt, image, tags, author } = req.body;
//     const blog = await createBlog({
//       title,
//       content,
//       category,
//       excerpt,
//       image,
//       tags,
//       author,
//     });
//     res.status(201).json(blog);
//   } catch (err) {
//     res.status(500).json({ msg: "Error creating blog", error: err.message });
//   }
// };

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

    // Remove any numeric conversion - use string ID directly
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
