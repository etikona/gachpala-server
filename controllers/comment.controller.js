import { addComment } from "../models/comment.model.js";

const createComment = async (req, res) => {
  try {
    const { content } = req.body;
    const blogId = req.params.blogId;
    const userId = req.user.id;

    const comment = await addComment({ userId, blogId, content });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ msg: "Error adding comment", error: err.message });
  }
};

export default createComment;
