/**
 * What it is: Admin panel page (Posts + Gallery management).
 * Non-tech note: Admins can add/update announcements and gallery images.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import { adminFetch, isAdminAuthenticated } from "../../utils/adminAuth";
import { formatDateTime } from "../../utils/dateTime";
import { FaPlusCircle, FaImages, FaImage, FaTimes, FaUpload, FaTrash } from "react-icons/fa";
import AdminNavbar from "../../components/adminPanel/AdminNavbar";

const apiBase = import.meta.env.VITE_API_BASE_URL || "/api";

/**
 * Bluefins admin screen: Content Management.
 * Admins publish announcements (posts) and curate the homepage/gallery images.
 * Images are uploaded to Cloudinary and the returned URL is stored in the DB.
 */
const Posts = () => {
  const navigate = useNavigate();

  useEffect(/**
   * Admin-only guard: redirect to login if the admin session is missing.
   */
  () => {
    if (!isAdminAuthenticated()) {
      navigate("/admin");
    }
  }, [navigate]);

  const [activeTab, setActiveTab] = useState("posts"); // "posts" or "gallery"
  const [posts, setPosts] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
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

  // Gallery form state
  const [galleryFormData, setGalleryFormData] = useState({
    title: "",
    description: "",
    category: "other"
  });
  const [galleryImageFile, setGalleryImageFile] = useState(null);
  const [galleryImagePreview, setGalleryImagePreview] = useState(null);

  // Fetch posts and gallery from backend
  useEffect(/**
   * Initial load: fetch both announcements and gallery images.
   */
  () => {
    fetchPosts();
    fetchGallery();
  }, []);

  /**
   * Load announcements shown to users (news, closures, event updates).
   */
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/posts`);
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

  /**
    * Load gallery images used across the public site (training, events, facilities).
   */
  const fetchGallery = async () => {
    try {
      const response = await fetch(`${apiBase}/gallery`);
      const data = await response.json();
      
      if (data.success) {
        setGalleryImages(data.data);
      }
    } catch (err) {
      console.error("Error fetching gallery:", err);
    }
  };

  /**
    * Handle selecting an image for an announcement and generate a local preview.
   */
  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  /**
    * Upload the selected announcement image to Cloudinary.
    * Returns a public URL + publicId for later cleanup if needed.
   */
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

  /**
    * Create a new announcement.
    * If an image is selected, upload to Cloudinary first, then submit the post.
   */
  const handleSubmit = async e => {
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

  	  const response = await adminFetch(`${apiBase}/posts`, {
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

  /**
    * Delete an announcement after admin confirmation.
   */
  const deletePost = async id => {
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
        const response = await adminFetch(`${apiBase}/posts/${id}`, {
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

  /**
    * Reset the announcement form and close the modal section.
   */
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

  /**
   * Update announcement form fields.
   */
  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
    * Handle selecting a gallery image and generate a local preview.
   */
  // Gallery handlers
  const handleGalleryImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      setGalleryImageFile(file);
      setGalleryImagePreview(URL.createObjectURL(file));
    }
  };

  /**
    * Add a new gallery image.
    * Upload the file to Cloudinary, then store metadata (title/description/category).
   */
  const handleGallerySubmit = async e => {
    e.preventDefault();

    if (!galleryImageFile) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Image Required',
        text: 'Please select an image to upload',
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
      
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', galleryImageFile);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const cloudinaryData = await cloudinaryResponse.json();

      // Save to database
      const galleryData = {
        title: galleryFormData.title || undefined,
        description: galleryFormData.description || undefined,
        category: galleryFormData.category,
        imageUrl: cloudinaryData.secure_url,
        cloudinaryPublicId: cloudinaryData.public_id
      };

  	  const response = await adminFetch(`${apiBase}/gallery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(galleryData),
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Success!',
          text: 'Gallery image added successfully',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          background: 'linear-gradient(135deg, #4ECDC4, #54A0FF)',
          color: '#fff',
          iconColor: '#fff'
        });
        fetchGallery();
        resetGalleryForm();
      } else {
        throw new Error(data.message || 'Failed to add gallery image');
      }
    } catch (error) {
      console.error('Error creating gallery image:', error);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Error',
        text: 'Failed to add gallery image. Please try again.',
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

  /**
    * Delete a gallery image after admin confirmation.
   */
  const deleteGalleryImage = async id => {
    const result = await Swal.fire({
      title: 'Delete Gallery Image?',
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
        const response = await adminFetch(`${apiBase}/gallery/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        
        if (data.success) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Deleted!',
            text: 'Gallery image deleted successfully',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: 'linear-gradient(135deg, #4ECDC4, #54A0FF)',
            color: '#fff',
            iconColor: '#fff'
          });
          fetchGallery();
        } else {
          throw new Error('Failed to delete');
        }
      } catch (err) {
        console.error("Error deleting gallery image:", err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete gallery image. Please try again.',
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

  /**
    * Reset the gallery form and close the “add image” section.
   */
  const resetGalleryForm = () => {
    setGalleryFormData({
      title: "",
      description: "",
      category: "other"
    });
    setGalleryImageFile(null);
    setGalleryImagePreview(null);
    setShowGalleryForm(false);
  };

  /**
   * Update gallery form fields (title/description/category).
   */
  const handleGalleryChange = e => {
    setGalleryFormData({ ...galleryFormData, [e.target.name]: e.target.value });
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
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ color: "#fff", fontSize: "2.5rem", fontWeight: "700", marginBottom: "10px" }}>
            📢 Content Management
          </h1>
          <p style={{ color: "#b0b0b0", fontSize: "1rem", marginBottom: "20px" }}>
            Manage announcements and homepage gallery
          </p>

          {/* Tab Navigation */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
            <button
              onClick={/**
               * Switch to announcement management.
               */
              () => {
                setActiveTab("posts");
                setShowPostForm(false);
                setShowGalleryForm(false);
              }}
              style={{
                background: activeTab === "posts" ? "linear-gradient(135deg, #4ECDC4, #54A0FF)" : "rgba(255, 255, 255, 0.1)",
                border: activeTab === "posts" ? "none" : "2px solid rgba(255, 255, 255, 0.2)",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: "10px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              📢 Announcements ({posts.length})
            </button>
            <button
              onClick={/**
               * Switch to gallery management.
               */
              () => {
                setActiveTab("gallery");
                setShowPostForm(false);
                setShowGalleryForm(false);
              }}
              style={{
                background: activeTab === "gallery" ? "linear-gradient(135deg, #667eea, #764ba2)" : "rgba(255, 255, 255, 0.1)",
                border: activeTab === "gallery" ? "none" : "2px solid rgba(255, 255, 255, 0.2)",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: "10px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              🖼️ Gallery ({galleryImages.length})
            </button>
          </div>

          {/* Action Button */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            {activeTab === "posts" ? (
              <button
                onClick={/**
                 * Toggle the “create post” form.
                 */
                () => {
                  return setShowPostForm(!showPostForm);
                }}
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
                onMouseEnter={/**
                 * Hover affordance for the primary action button.
                 */
                e => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(78, 205, 196, 0.4)";
                }}
                onMouseLeave={/**
                 * Reset hover styles.
                 */
                e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <FaPlusCircle /> {showPostForm ? 'Cancel' : 'Create New Post'}
              </button>
            ) : (
              <button
                onClick={/**
                 * Toggle the “add gallery image” form.
                 */
                () => {
                  return setShowGalleryForm(!showGalleryForm);
                }}
                style={{
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
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
                onMouseEnter={/**
                 * Hover affordance for the primary action button.
                 */
                e => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.4)";
                }}
                onMouseLeave={/**
                 * Reset hover styles.
                 */
                e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <FaImages /> {showGalleryForm ? 'Cancel' : 'Add Gallery Image'}
              </button>
            )}
          </div>
        </div>

        {/* Statistics */}
        {activeTab === "posts" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            <div style={{ background: "rgba(78, 205, 196, 0.1)", border: "2px solid #4ECDC4", borderRadius: "15px", padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: "700", color: "#4ECDC4", marginBottom: "5px" }}>{posts.length}</div>
              <div style={{ color: "#b0b0b0", fontSize: "0.9rem" }}>Total Posts</div>
            </div>
            <div style={{ background: "rgba(102, 126, 234, 0.1)", border: "2px solid #667eea", borderRadius: "15px", padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: "700", color: "#667eea", marginBottom: "5px" }}>{posts.filter(/**
               * Count announcements that include an image.
               */
              p => {
                return p.imageUrl;
              }).length}</div>
              <div style={{ color: "#b0b0b0", fontSize: "0.9rem" }}>With Images</div>
            </div>
          </div>
        )}

        {activeTab === "gallery" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            <div style={{ background: "rgba(102, 126, 234, 0.1)", border: "2px solid #667eea", borderRadius: "15px", padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: "700", color: "#667eea", marginBottom: "5px" }}>{galleryImages.length}</div>
              <div style={{ color: "#b0b0b0", fontSize: "0.9rem" }}>Total Images</div>
            </div>
            <div style={{ background: "rgba(255, 215, 61, 0.1)", border: "2px solid #FFD93D", borderRadius: "15px", padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: "700", color: "#FFD93D", marginBottom: "5px" }}>{galleryImages.filter(/**
               * Count gallery items that are marked active.
               */
              img => {
                return img.isActive;
              }).length}</div>
              <div style={{ color: "#b0b0b0", fontSize: "0.9rem" }}>Active</div>
            </div>
          </div>
        )}

        {/* Create Gallery Image Form */}
        {showGalleryForm && activeTab === "gallery" && (
          <div style={{ background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(15px)", border: "2px solid rgba(255, 255, 255, 0.1)", borderRadius: "20px", padding: "30px", marginBottom: "30px" }}>
            <h3 style={{ color: "#667eea", fontSize: "1.5rem", fontWeight: "700", marginBottom: "20px" }}>Add Gallery Image</h3>
            <form onSubmit={handleGallerySubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#fff", fontSize: "0.9rem", marginBottom: "8px", display: "block" }}>Title (Optional)</label>
                <input
                  type="text"
                  name="title"
                  value={galleryFormData.title}
                  onChange={handleGalleryChange}
                  placeholder="Enter image title"
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
                <label style={{ color: "#fff", fontSize: "0.9rem", marginBottom: "8px", display: "block" }}>Description (Optional)</label>
                <textarea
                  name="description"
                  value={galleryFormData.description}
                  onChange={handleGalleryChange}
                  placeholder="Brief description"
                  rows="3"
                  maxLength="500"
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
                <label style={{ color: "#fff", fontSize: "0.9rem", marginBottom: "8px", display: "block" }}>Category</label>
                <select
                  name="category"
                  value={galleryFormData.category}
                  onChange={handleGalleryChange}
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    color: "#fff",
                    fontSize: "0.95rem",
                  }}
                >
                  <option value="other" style={{ background: "#1a1f3a", color: "#fff" }}>Other</option>
                  <option value="training" style={{ background: "#1a1f3a", color: "#fff" }}>Training</option>
                  <option value="events" style={{ background: "#1a1f3a", color: "#fff" }}>Events</option>
                  <option value="facilities" style={{ background: "#1a1f3a", color: "#fff" }}>Facilities</option>
                  <option value="achievements" style={{ background: "#1a1f3a", color: "#fff" }}>Achievements</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ color: "#ff0000ff", fontSize: "0.9rem", marginBottom: "8px", display: "block" }}> <b>*</b> Image (Required)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryImageChange}
                  style={{ display: "none" }}
                  id="galleryImageUpload"
                />
                <label
                  htmlFor="galleryImageUpload"
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
                  onMouseEnter={/**
                   * Slight hover highlight for the “choose image” control.
                   */
                  e => {
                    return e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                  }}
                  onMouseLeave={/**
                   * Reset hover highlight.
                   */
                  e => {
                    return e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  }}
                >
                  <FaImage /> Choose Image
                </label>
                {galleryImagePreview && (
                  <div style={{ marginTop: "15px", position: "relative", display: "inline-block" }}>
                    <img src={galleryImagePreview} alt="Preview" style={{ maxWidth: "300px", maxHeight: "200px", borderRadius: "10px", border: "2px solid #667eea" }} />
                    <button
                      type="button"
                      onClick={/**
                       * Remove the selected gallery image before uploading.
                       */
                      () => {
                        setGalleryImageFile(null);setGalleryImagePreview(null);
                      }}
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
                    background: "linear-gradient(135deg, #667eea, #764ba2)",
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
                  <FaUpload /> {uploading ? 'Uploading...' : 'Add to Gallery'}
                </button>
                <button
                  type="button"
                  onClick={resetGalleryForm}
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

        {/* Create Post Form */}
        {showPostForm && activeTab === "posts" && (
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
                  onMouseEnter={/**
                   * Slight hover highlight for the “choose image” control.
                   */
                  e => {
                    return e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                  }}
                  onMouseLeave={/**
                   * Reset hover highlight.
                   */
                  e => {
                    return e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  }}
                >
                  <FaImage /> Choose Image
                </label>
                {imagePreview && (
                  <div style={{ marginTop: "15px", position: "relative", display: "inline-block" }}>
                    <img src={imagePreview} alt="Preview" style={{ maxWidth: "300px", maxHeight: "200px", borderRadius: "10px", border: "2px solid #4ECDC4" }} />
                    <button
                      type="button"
                      onClick={/**
                       * Remove the selected announcement image before publishing.
                       */
                      () => {
                        setImageFile(null);setImagePreview(null);
                      }}
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
        {activeTab === "posts" && !loading && !error && posts.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px", color: "#b0b0b0", fontSize: "1.1rem" }}>
            No posts yet. Create your first announcement!
          </div>
        )}

        {activeTab === "posts" && (
          <div style={{ display: "grid", gap: "20px" }}>
            {posts.map(/**
             * Render each announcement card.
             */
            post => {
              return (
                <div
                  key={post._id}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "2px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "15px",
                    padding: "25px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={/**
                   * Hover affordance for cards in the admin list.
                   */
                  e => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.3)";
                  }}
                  onMouseLeave={/**
                   * Reset hover styles.
                   */
                  e => {
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
                                {formatDateTime(post.createdAt)}
                        </span>
                        <button
                          onClick={/**
                           * Delete this announcement.
                           */
                          () => {
                            return deletePost(post._id);
                          }}
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
                          onMouseEnter={/**
                           * Hover affordance for destructive action.
                           */
                          e => {
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 4px 15px rgba(255, 107, 107, 0.4)";
                          }}
                          onMouseLeave={/**
                           * Reset hover styles.
                           */
                          e => {
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
              );
            })}
          </div>
        )}

        {/* Gallery Images Grid */}
        {activeTab === "gallery" && galleryImages.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px", color: "#b0b0b0", fontSize: "1.1rem" }}>
            No gallery images yet. Add your first image!
          </div>
        )}

        {activeTab === "gallery" && galleryImages.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {galleryImages.map(/**
             * Render each gallery card.
             */
            image => {
              return (
                <div
                  key={image._id}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "2px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "15px",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={/**
                   * Hover affordance for gallery cards.
                   */
                  e => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(102, 126, 234, 0.3)";
                  }}
                  onMouseLeave={/**
                   * Reset hover styles.
                   */
                  e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ position: "relative", width: "100%", height: "200px", overflow: "hidden" }}>
                    <img
                      src={image.imageUrl}
                      alt={image.title || 'Gallery image'}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    {image.category && (
                      <span style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        background: "rgba(102, 126, 234, 0.9)",
                        color: "#fff",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        textTransform: "capitalize"
                      }}>
                        {image.category}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "15px" }}>
                    {image.title && (
                      <h4 style={{ color: "#667eea", fontSize: "1.1rem", fontWeight: "700", marginBottom: "8px" }}>
                        {image.title}
                      </h4>
                    )}
                    {image.description && (
                      <p style={{ color: "#e0e0e0", fontSize: "0.85rem", marginBottom: "10px", lineHeight: "1.5" }}>
                        {image.description}
                      </p>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                      <span style={{ color: "#b0b0b0", fontSize: "0.75rem" }}>
                        {new Date(image.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={/**
                         * Delete this gallery image.
                         */
                        () => {
                          return deleteGalleryImage(image._id);
                        }}
                        style={{
                          background: "linear-gradient(135deg, #FF6B6B, #FF9FF3)",
                          border: "none",
                          color: "#fff",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={/**
                         * Hover affordance for destructive action.
                         */
                        e => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 4px 15px rgba(255, 107, 107, 0.4)";
                        }}
                        onMouseLeave={/**
                         * Reset hover styles.
                         */
                        e => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Posts;
