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

     
    </div>
  );
};

export default Posts;
