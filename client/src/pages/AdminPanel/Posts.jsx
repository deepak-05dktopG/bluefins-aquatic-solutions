import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/adminPanel/AdminNavbar.jsx";
import { FaTrash, FaPlusCircle, FaImage, FaTimes, FaUpload } from "react-icons/fa";
import Swal from 'sweetalert2';

const Posts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (isAdmin !== "true") {
      navigate("/admin");
    }
  }, [navigate]);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    caption: "",
    content: "",
    imageUrl: "",
    cloudinaryPublicId: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch posts from backend
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts`);
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.data);
      } else {
        setError("Failed to fetch posts");
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImageToCloudinary = async () => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      return {
        url: data.secure_url,
        publicId: data.public_id
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error('Failed to upload image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate at least one field is filled
    if (!formData.title && !formData.caption && !formData.content && !imageFile) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Required Field',
        text: 'Please provide at least one field (title, caption, content, or image)',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: 'linear-gradient(135deg, #FFD93D, #FF9FF3)',
        color: '#fff',
        iconColor: '#fff'
      });
      return;
    }

    try {
      setUploading(true);
      
      let imageData = null;
      if (imageFile) {
        imageData = await uploadImageToCloudinary();
      }

      const postData = {
        title: formData.title || undefined,
        caption: formData.caption || undefined,
        content: formData.content || undefined,
        imageUrl: imageData?.url || undefined,
        cloudinaryPublicId: imageData?.publicId || undefined
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Success!',
          text: 'Post created successfully',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: 'linear-gradient(135deg, #4ECDC4, #54A0FF)',
          color: '#fff',
          iconColor: '#fff'
        });
        fetchPosts();
        resetForm();
      } else {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Failed',
          text: data.message || 'Failed to create post',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: 'linear-gradient(135deg, #FF6B6B, #FF9FF3)',
          color: '#fff',
          iconColor: '#fff'
        });
      }
    } catch (error) {
      console.error('Error creating post:', error);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Error',
        text: 'Failed to create post. Please try again.',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: 'linear-gradient(135deg, #FF6B6B, #FF9FF3)',
        color: '#fff',
        iconColor: '#fff'
      });
    } finally {
      setUploading(false);
    }
  };

  const deletePost = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Post?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF6B6B',
      cancelButtonColor: '#667eea',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      background: 'linear-gradient(135deg, #1a1f3a, #0f1629)',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        
        if (data.success) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Deleted!',
            text: 'Post deleted successfully',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: 'linear-gradient(135deg, #4ECDC4, #54A0FF)',
            color: '#fff',
            iconColor: '#fff'
          });
          fetchPosts();
        } else {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Failed',
            text: 'Failed to delete post',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: 'linear-gradient(135deg, #FF6B6B, #FF9FF3)',
            color: '#fff',
            iconColor: '#fff'
          });
        }
      } catch (err) {
        console.error("Error deleting post:", err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete post. Please try again.',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: 'linear-gradient(135deg, #FF6B6B, #FF9FF3)',
          color: '#fff',
          iconColor: '#fff'
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      caption: "",
      content: "",
      imageUrl: "",
      cloudinaryPublicId: ""
    });
    setImageFile(null);
    setImagePreview(null);
    setShowPostForm(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%)",
        fontFamily: "Poppins, system-ui",
      }}
    >
      <AdminNavbar />

      <div style={{ padding: "50px 20px 40px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" }}>
          <div>
            <h1 style={{ color: "#fff", fontSize: "2.5rem", fontWeight: "700", marginBottom: "10px" }}>
             📢 Announcements & Posts
            </h1>
            <p style={{ color: "#b0b0b0", fontSize: "1rem" }}>
              Create and manage posts to display on the homepage
            </p>
          </div>
          <button
            onClick={() => setShowPostForm(!showPostForm)}
            style={{
              background: "linear-gradient(135deg, #4ECDC4, #54A0FF)",
              border: "none",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: "10px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(78, 205, 196, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <FaPlusCircle /> {showPostForm ? 'Cancel' : 'Create New Post'}
          </button>
        </div>

        {/* Statistics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          <div style={{ background: "rgba(78, 205, 196, 0.1)", border: "2px solid #4ECDC4", borderRadius: "15px", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "#4ECDC4", marginBottom: "5px" }}>{posts.length}</div>
            <div style={{ color: "#b0b0b0", fontSize: "0.9rem" }}>Total Posts</div>
          </div>
          <div style={{ background: "rgba(102, 126, 234, 0.1)", border: "2px solid #667eea", borderRadius: "15px", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: "700", color: "#667eea", marginBottom: "5px" }}>{posts.filter(p => p.imageUrl).length}</div>
            <div style={{ color: "#b0b0b0", fontSize: "0.9rem" }}>With Images</div>
          </div>
        </div>

        {/* Create Post Form */}
        {showPostForm && (
          <div style={{ background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(15px)", border: "2px solid rgba(255, 255, 255, 0.1)", borderRadius: "20px", padding: "30px", marginBottom: "30px" }}>
            <h3 style={{ color: "#4ECDC4", fontSize: "1.5rem", fontWeight: "700", marginBottom: "20px" }}>Create New Post</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#fff", fontSize: "0.9rem", marginBottom: "8px", display: "block" }}>Title (Optional)</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter post title"
                  maxLength="100"
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#fff", fontSize: "0.9rem", marginBottom: "8px", display: "block" }}>Caption (Optional)</label>
                <input
                  type="text"
                  name="caption"
                  value={formData.caption}
                  onChange={handleChange}
                  placeholder="Short caption"
                  maxLength="200"
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#fff", fontSize: "0.9rem", marginBottom: "8px", display: "block" }}>Content (Optional)</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Detailed content"
                  rows="5"
                  maxLength="2000"
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    color: "#fff",
                    fontSize: "0.95rem",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#ff0000ff", fontSize: "0.9rem", marginBottom: "8px", display: "block" }}> <b>*</b> Image (Mandatory)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                  id="imageUpload"
                />
                <label
                  htmlFor="imageUpload"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px dashed rgba(255, 255, 255, 0.3)",
                    borderRadius: "10px",
                    padding: "12px 20px",
                    color: "#fff",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
                >
                  <FaImage /> Choose Image
                </label>
                {imagePreview && (
                  <div style={{ marginTop: "15px", position: "relative", display: "inline-block" }}>
                    <img src={imagePreview} alt="Preview" style={{ maxWidth: "300px", maxHeight: "200px", borderRadius: "10px", border: "2px solid #4ECDC4" }} />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      style={{
                        position: "absolute",
                        top: "5px",
                        right: "5px",
                        background: "#FF6B6B",
                        border: "none",
                        color: "#fff",
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    background: "linear-gradient(135deg, #4ECDC4, #54A0FF)",
                    border: "none",
                    color: "#fff",
                    padding: "12px 30px",
                    borderRadius: "10px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: uploading ? "not-allowed" : "pointer",
                    opacity: uploading ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FaUpload /> {uploading ? 'Publishing...' : 'Publish Post'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                    padding: "12px 30px",
                    borderRadius: "10px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: "center", padding: "50px", color: "#fff", fontSize: "1.2rem" }}>
            Loading posts...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{ background: "rgba(255, 107, 107, 0.2)", border: "2px solid #FF6B6B", borderRadius: "15px", padding: "20px", textAlign: "center", color: "#FF6B6B", marginBottom: "20px" }}>
            {error}
          </div>
        )}

        {/* Posts List */}
        {!loading && !error && posts.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px", color: "#b0b0b0", fontSize: "1.1rem" }}>
            No posts yet. Create your first announcement!
          </div>
        )}

        <div style={{ display: "grid", gap: "20px" }}>
          {posts.map((post) => (
            <div
              key={post._id}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "2px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "15px",
                padding: "25px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt={post.title || 'Post image'}
                    style={{
                      width: "200px",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      border: "2px solid #4ECDC4"
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  {post.title && (
                    <h3 style={{ color: "#4ECDC4", fontSize: "1.3rem", fontWeight: "700", marginBottom: "10px" }}>
                      {post.title}
                    </h3>
                  )}
                  {post.caption && (
                    <p style={{ color: "#FFD93D", fontSize: "1rem", fontWeight: "600", marginBottom: "10px" }}>
                      {post.caption}
                    </p>
                  )}
                  {post.content && (
                    <p style={{ color: "#e0e0e0", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "15px" }}>
                      {post.content}
                    </p>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px" }}>
                    <span style={{ color: "#b0b0b0", fontSize: "0.85rem" }}>
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                    <button
                      onClick={() => deletePost(post._id)}
                      style={{
                        background: "linear-gradient(135deg, #FF6B6B, #FF9FF3)",
                        border: "none",
                        color: "#fff",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(255, 107, 107, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Posts;
