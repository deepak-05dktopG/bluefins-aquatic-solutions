import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/adminPanel/AdminNavbar.jsx";
import { FaTrash, FaPlusCircle, FaEye, FaEdit } from "react-icons/fa";

const Posts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (isAdmin !== "true") {
      navigate("/admin");
    }
  }, [navigate]);

  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "Achievement: National Record!",
      author: "Mr. Vijeesh",
      date: "2025-11-12",
      views: 245,
      content: "Our student Arjun broke the state record in 100m freestyle! This is a proud moment for Bluefins Aquatic Solutions. With consistent training and dedication, our swimmers are achieving remarkable milestones.",
      status: "published",
    },
    {
      id: 2,
      title: "New Coaching Method",
      author: "Mr. Manikandan",
      date: "2025-11-10",
      views: 189,
      content: "Introducing the latest coaching methodology that focuses on personalized attention and technique refinement. This new approach has shown 30% improvement in student performance.",
      status: "published",
    },
    {
      id: 3,
      title: "Summer Camp Registration Open",
      author: "Admin",
      date: "2025-11-08",
      views: 312,
      content: "Register now for our exclusive summer swimming camp! Limited slots available. Special focus on competitive swimming techniques and water safety.",
      status: "published",
    },
    {
      id: 4,
      title: "Upcoming Championship",
      author: "Mr. Vijeesh",
      date: "2025-11-05",
      views: 156,
      content: "State-level swimming championship scheduled for December 2025. We are preparing our advanced level swimmers for this prestigious event.",
      status: "draft",
    },
  ]);

  const [showPostForm, setShowPostForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    author: "Admin",
    status: "published",
  });

  const addPost = () => {
    if (newPost.title && newPost.content) {
      if (editingPost) {
        // Update existing post
        setPosts(
          posts.map((post) =>
            post.id === editingPost.id
              ? { ...post, ...newPost }
              : post
          )
        );
        setEditingPost(null);
      } else {
        // Add new post
        setPosts([
          {
            ...newPost,
            id: Date.now(),
            date: new Date().toISOString().split("T")[0],
            views: 0,
          },
          ...posts,
        ]);
      }
      setNewPost({ title: "", content: "", author: "Admin", status: "published" });
      setShowPostForm(false);
    }
  };

  const deletePost = (id) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      setPosts(posts.filter((post) => post.id !== id));
    }
  };

  const editPost = (post) => {
    setNewPost({
      title: post.title,
      content: post.content,
      author: post.author,
      status: post.status,
    });
    setEditingPost(post);
    setShowPostForm(true);
  };

  const cancelEdit = () => {
    setNewPost({ title: "", content: "", author: "Admin", status: "published" });
    setEditingPost(null);
    setShowPostForm(false);
  };

  // Statistics
  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.status === "published").length;
  const draftPosts = posts.filter((p) => p.status === "draft").length;
  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%)",
        fontFamily: "Poppins, system-ui",
      }}
    >
      <AdminNavbar />

      <div style={{ padding: "40px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Page Header */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ color: "#FFB6C1", fontSize: "2.2rem", fontWeight: 900, marginBottom: "10px" }}>
            📰 Posts & Updates
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "1rem" }}>
            Create and manage announcements, achievements, and updates
          </p>
        </div>

        {/* Stats Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              background: "rgba(255, 182, 193, 0.1)",
              border: "1px solid #FFB6C1",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: "0 0 5px 0", fontSize: "0.9rem" }}>
              Total Posts
            </p>
            <h2 style={{ color: "#FFB6C1", margin: 0, fontSize: "2rem", fontWeight: 900 }}>
              {totalPosts}
            </h2>
          </div>
          <div
            style={{
              background: "rgba(0, 255, 100, 0.1)",
              border: "1px solid #00FF64",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: "0 0 5px 0", fontSize: "0.9rem" }}>
              Published
            </p>
            <h2 style={{ color: "#00FF64", margin: 0, fontSize: "2rem", fontWeight: 900 }}>
              {publishedPosts}
            </h2>
          </div>
          <div
            style={{
              background: "rgba(255, 215, 0, 0.1)",
              border: "1px solid #FFD700",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: "0 0 5px 0", fontSize: "0.9rem" }}>
              Drafts
            </p>
            <h2 style={{ color: "#FFD700", margin: 0, fontSize: "2rem", fontWeight: 900 }}>
              {draftPosts}
            </h2>
          </div>
          <div
            style={{
              background: "rgba(0, 255, 212, 0.1)",
              border: "1px solid #00FFD4",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: "0 0 5px 0", fontSize: "0.9rem" }}>
              Total Views
            </p>
            <h2 style={{ color: "#00FFD4", margin: 0, fontSize: "2rem", fontWeight: 900 }}>
              {totalViews}
            </h2>
          </div>
        </div>

        {/* Add Post Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "25px" }}>
          <button
            onClick={() => setShowPostForm(!showPostForm)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)",
              color: "#000",
              padding: "12px 24px",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <FaPlusCircle /> Create Post
          </button>
        </div>

        {/* Post Form */}
        {showPostForm && (
          <div
            style={{
              background: "rgba(255, 182, 193, 0.1)",
              border: "1px solid rgba(255, 182, 193, 0.3)",
              padding: "25px",
              borderRadius: "12px",
              marginBottom: "30px",
            }}
          >
            <h3 style={{ color: "#FFB6C1", marginBottom: "20px" }}>
              {editingPost ? "Edit Post" : "Create New Post"}
            </h3>
            <input
              type="text"
              placeholder="Post Title"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "15px",
                border: "1px solid rgba(255, 182, 193, 0.3)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontFamily: "Poppins, system-ui",
                fontSize: "1rem",
              }}
            />
            <textarea
              placeholder="Post Content"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "15px",
                border: "1px solid rgba(255, 182, 193, 0.3)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                minHeight: "150px",
                fontFamily: "Poppins, system-ui",
                fontSize: "1rem",
                resize: "vertical",
              }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <input
                type="text"
                placeholder="Author Name"
                value={newPost.author}
                onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 182, 193, 0.3)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontFamily: "Poppins, system-ui",
                }}
              />
              <select
                value={newPost.status}
                onChange={(e) => setNewPost({ ...newPost, status: e.target.value })}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 182, 193, 0.3)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontFamily: "Poppins, system-ui",
                  cursor: "pointer",
                }}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={addPost}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)",
                  color: "#000",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {editingPost ? "Update Post" : "Publish Post"}
              </button>
              <button
                onClick={cancelEdit}
                style={{
                  padding: "12px 20px",
                  background: "rgba(255, 50, 100, 0.2)",
                  color: "#FF6B9D",
                  border: "1px solid rgba(255, 50, 100, 0.4)",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Posts List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {posts.map((post) => (
            <div
              key={post.id}
              style={{
                background: "rgba(255, 182, 193, 0.08)",
                border: `1px solid ${post.status === "published" ? "#00FF64" : "#FFD700"}`,
                borderLeft: `4px solid ${post.status === "published" ? "#00FF64" : "#FFD700"}`,
                borderRadius: "12px",
                padding: "25px",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 182, 193, 0.15)";
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 182, 193, 0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "15px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <h3 style={{ color: "#FFB6C1", margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>
                      {post.title}
                    </h3>
                    <span
                      style={{
                        background: post.status === "published" ? "#00FF64" : "#FFD700",
                        color: "#000",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {post.status}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <span>By {post.author}</span>
                    <span>📅 {post.date}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <FaEye /> {post.views} views
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => editPost(post)}
                    style={{
                      background: "rgba(0, 255, 212, 0.2)",
                      color: "#00FFD4",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    style={{
                      background: "rgba(255, 50, 100, 0.2)",
                      color: "#FF6B9D",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>

              <p
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  lineHeight: "1.7",
                  fontSize: "1rem",
                  margin: 0,
                }}
              >
                {post.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Posts;
