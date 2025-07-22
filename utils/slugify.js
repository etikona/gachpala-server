export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/--+/g, "-") // Replace multiple dashes
    .trim() // Trim edges
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes
};
