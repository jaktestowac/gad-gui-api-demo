const { formatErrorResponse, generateUuid } = require("../../../helpers/helpers");
const { logDebug } = require("../../../helpers/logger-api");
const {
  HTTP_OK,
  HTTP_BAD_REQUEST,
  HTTP_UNAUTHORIZED,
  HTTP_NOT_FOUND,
  HTTP_CREATED,
} = require("../../../helpers/response.helpers");
const jwt = require("jsonwebtoken");
const { sampleUsers, samplePosts, sampleComments, sampleLikes } = require("./testagram.data");

// In-memory storage for users, posts, comments, likes, follows
const users = [];
const posts = [];
const sessions = [];
const SECRET_KEY = "testagram-secret-key-2025";


// Add sample data to the in-memory storage
sampleUsers.forEach((user) => {
  users.push(user);
});

samplePosts.forEach((post) => {
  posts.push(post);
});

sampleComments.forEach((comment) => {
  const post = posts.find((p) => p.id === comment.postId);
  if (post) {
    post.comments.push(comment);
  }
});

sampleLikes.forEach((like) => {
  const post = posts.find((p) => p.id === like.postId);
  if (post) {
    post.likes.push(like);
  }
});

// Helper to generate token
const generateToken = (userId) => {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: "24h" });
};

// Middleware to verify token from cookies or Authorization header
const verifyToken = (req, res, next) => {
  let token = null;

  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  // If not in header, check cookies
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  logDebug("verifyToken:Token verification", { token });

  if (!token) {
    return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Please log in to access this feature"));
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.userId;

    // Check if user exists
    const user = users.find((u) => u.id === decoded.userId);
    if (!user) {
      return res
        .status(HTTP_UNAUTHORIZED)
        .send(formatErrorResponse("Session expired or invalid. Please log in again."));
    }

    return next(req, res);
  } catch (error) {
    return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Session expired or invalid. Please log in again."));
  }
};

// User registration
const register = (req, res) => {
  const { username, email, password, fullName } = req.body;

  // Validate required fields
  if (!username || !email || !password) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Missing required fields"));
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid email format"));
  }

  // Validate username (3-20 characters, only letters, numbers, dots and underscores)
  const usernameRegex = /^[a-zA-Z0-9._]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return res
      .status(HTTP_BAD_REQUEST)
      .send(
        formatErrorResponse(
          "Username must be 3-20 characters and can only contain letters, numbers, dots, and underscores"
        )
      );
  }

  // Validate password (at least 6 characters)
  if (password.length < 6) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Password must be at least 6 characters long"));
  }

  // Check if user already exists
  if (users.some((u) => u.username === username || u.email === email)) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Username or email already in use"));
  }

  const newUser = {
    id: generateUuid(),
    username,
    email,
    password, // Note: In a real app, you would hash the password
    fullName: fullName || username,
    profilePic: `/practice/testagram/images/default-profile.svg`,
    bio: "",
    createdAt: new Date().toISOString(),
    followers: [],
    following: [],
  };

  users.push(newUser);
  logDebug("User registered", { username, id: newUser.id });

  // Generate and store token
  const token = generateToken(newUser.id);

  // Store active session
  sessions.push({
    userId: newUser.id,
    token,
    createdAt: new Date().toISOString(),
  });

  res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // 24 hours

  return res.status(HTTP_CREATED).json({
    message: "User registered successfully",
    user: { ...newUser, password: undefined }, // Exclude password from response
    token,
  });
};

// User login
const login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Missing username or password"));
  }

  // Validate password length
  if (password.length < 3) {
    return res
      .status(HTTP_BAD_REQUEST)
      .send(formatErrorResponse("Invalid password format. Password must be at least 3 characters long"));
  }

  // Find user
  const user = users.find((u) => (u.username === username || u.email === username) && u.password === password);

  if (!user) {
    return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("Invalid username or password. Please try again."));
  }

  // Generate and store token
  const token = generateToken(user.id);

  // Store active session
  sessions.push({
    userId: user.id,
    token,
    createdAt: new Date().toISOString(),
  });

  res.cookie("token", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // 24 hours

  logDebug("User logged in", { username, id: user.id });

  return res.status(HTTP_OK).json({
    message: "Login successful",
    user: { ...user, password: undefined }, // Exclude password from response
    token,
  });
};

// User logout
const logout = (req, res) => {
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(" ")[1]);

  if (token) {
    // Remove session
    const sessionIndex = sessions.findIndex((s) => s.token === token);
    if (sessionIndex !== -1) {
      sessions.splice(sessionIndex, 1);
    }

    // Clear cookie
    res.clearCookie("token");
  }

  return res.status(HTTP_OK).json({ message: "Logged out successfully" });
};

// Check authentication status
const checkAuth = (req, res) => {
  // If this point is reached, the token is valid (checked by verifyToken middleware)
  const user = users.find((u) => u.id === req.userId);

  if (!user) {
    return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not found"));
  }

  return res.status(HTTP_OK).json({
    isAuthenticated: true,
    user: { ...user, password: undefined },
  });
};

// Create a new post
const createPost = (req, res) => {
  const { caption, imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Image URL is required"));
  }

  // Validate imageUrl format (must be a valid URL)
  try {
    new URL(imageUrl);
  } catch (e) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Please provide a valid image URL"));
  }

  // Validate caption length
  if (caption && caption.length > 2000) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Caption is too long (maximum 2000 characters)"));
  }

  const newPost = {
    id: generateUuid(),
    userId: req.userId,
    caption: caption || "",
    imageUrl,
    likes: [],
    comments: [],
    createdAt: new Date().toISOString(),
  };

  posts.push(newPost);
  logDebug("Post created", { postId: newPost.id, userId: req.userId });

  // Add user data to the post
  const postUser = users.find((u) => u.id === req.userId);
  if (postUser) {
    newPost.username = postUser.username;
    newPost.userProfilePic = postUser.profilePic;
  }

  return res.status(HTTP_CREATED).json(newPost);
};

// Get all posts (feed)
const getPosts = (req, res) => {
  const user = users.find((u) => u.id === req.userId);

  if (!user) {
    return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("User not found"));
  }

  // Parse pagination parameters
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 3;
  const startIndex = page * limit;

  // Get all posts, sorted by creation date (newest first)
  const feedPosts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Paginate the results
  const paginatedPosts = feedPosts.slice(startIndex, startIndex + limit);

  // Add user data to each post
  paginatedPosts.forEach((post) => {
    const postUser = users.find((u) => u.id === post.userId);
    if (postUser) {
      post.username = postUser.username;
      post.userProfilePic = postUser.profilePic;
    }
  });

  // Return paginated posts with metadata
  return res.status(HTTP_OK).json({
    posts: paginatedPosts,
    hasMore: startIndex + limit < feedPosts.length,
    total: feedPosts.length,
  });
};

// Get a single post by ID
const getPostById = (req, res) => {
  const { id } = req.params;

  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Post not found"));
  }

  // Add user data to the post
  const postUser = users.find((u) => u.id === post.userId);
  if (postUser) {
    post.username = postUser.username;
    post.userProfilePic = postUser.profilePic;
  }

  return res.status(HTTP_OK).json(post);
};

// Like/unlike a post
const toggleLike = (req, res) => {
  const { id } = req.params;

  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Post not found"));
  }

  // Check if user already liked the post
  const likeIndex = post.likes.findIndex((like) => like.userId === req.userId);

  if (likeIndex === -1) {
    // Add like
    const user = users.find((u) => u.id === req.userId);
    post.likes.push({
      userId: req.userId,
      username: user.username,
      createdAt: new Date().toISOString(),
    });
    logDebug("Post liked", { postId: post.id, userId: req.userId });
  } else {
    // Remove like
    post.likes.splice(likeIndex, 1);
    logDebug("Post unliked", { postId: post.id, userId: req.userId });
  }

  // Add user data to the post
  const postUser = users.find((u) => u.id === post.userId);
  if (postUser) {
    post.username = postUser.username;
    post.userProfilePic = postUser.profilePic;
  }

  return res.status(HTTP_OK).json(post);
};

// Add comment to a post
const addComment = (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Comment text is required"));
  }

  // Validate comment length
  if (text.length > 500) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Comment is too long (maximum 500 characters)"));
  }

  // Prevent empty or whitespace-only comments
  if (text.trim() === "") {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Comment cannot be empty"));
  }

  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Post not found"));
  }

  const user = users.find((u) => u.id === req.userId);

  const newComment = {
    id: generateUuid(),
    userId: req.userId,
    text,
    createdAt: new Date().toISOString(),
  };

  post.comments.push(newComment);
  logDebug("Comment added", { postId: post.id, commentId: newComment.id, userId: req.userId });

  // Add user data to the comment
  const postUser = users.find((u) => u.id === post.userId);
  if (postUser) {
    newComment.username = postUser.username;
    newComment.userProfilePic = postUser.profilePic;
  }

  return res.status(HTTP_CREATED).json(newComment);
};

// Get user profile
const getUserProfile = (req, res) => {
  const { username } = req.params;

  const user = users.find((u) => u.username === username);

  if (!user) {
    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
  }

  // Get user's posts
  const userPosts = posts
    .filter((post) => post.userId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.status(HTTP_OK).json({
    user: { ...user, password: undefined },
    posts: userPosts,
    isFollowing: user.followers.includes(req.userId),
    followersCount: user.followers.length,
    followingCount: user.following.length,
  });
};

// Update user profile
const updateProfile = (req, res) => {
  const { fullName, bio, profilePic } = req.body;

  logDebug("Update profile", { userId: req.userId, fullName, bio, profilePic });

  // Validate input field lengths
  if (fullName && fullName.length > 50) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Full name is too long (maximum 50 characters)"));
  }

  if (bio && bio.length > 150) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Bio is too long (maximum 150 characters)"));
  }

  const userIndex = users.findIndex((u) => u.id === req.userId);

  if (userIndex === -1) {
    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
  }

  const updatedUser = {
    ...users[userIndex],
    fullName: fullName || users[userIndex].fullName,
    bio: bio !== undefined ? bio : users[userIndex].bio,
    profilePic: profilePic || users[userIndex].profilePic,
  };

  users[userIndex] = updatedUser;
  logDebug("Profile updated", { userId: req.userId });

  return res.status(HTTP_OK).json({
    message: "Profile updated successfully",
    user: { ...updatedUser, password: undefined },
  });
};

// Follow/unfollow user
const toggleFollow = (req, res) => {
  const { username } = req.params;

  if (users.find((u) => u.id === req.userId).username === username) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("You cannot follow yourself"));
  }

  const targetUser = users.find((u) => u.username === username);

  if (!targetUser) {
    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
  }

  const currentUser = users.find((u) => u.id === req.userId);

  // Check if already following
  const isFollowing = targetUser.followers.includes(currentUser.id);

  if (isFollowing) {
    // Unfollow
    targetUser.followers = targetUser.followers.filter((id) => id !== currentUser.id);
    currentUser.following = currentUser.following.filter((id) => id !== targetUser.id);
    logDebug("User unfollowed", { follower: currentUser.id, following: targetUser.id });
  } else {
    // Follow
    targetUser.followers.push(currentUser.id);
    currentUser.following.push(targetUser.id);
    logDebug("User followed", { follower: currentUser.id, following: targetUser.id });
  }

  return res.status(HTTP_OK).json({
    message: isFollowing ? "Unfollowed successfully" : "Followed successfully",
    isFollowing: !isFollowing,
  });
};

// Search users
const searchUsers = (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Search query is required"));
  }

  const searchResults = users
    .filter(
      (user) =>
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.fullName.toLowerCase().includes(query.toLowerCase())
    )
    .map((user) => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      profilePic: user.profilePic,
    }));

  return res.status(HTTP_OK).json(searchResults);
};

// Delete a post (only the owner can delete)
const deletePost = (req, res) => {
  const { id } = req.params;

  const postIndex = posts.findIndex((p) => p.id === id);

  if (postIndex === -1) {
    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Post not found"));
  }

  // Check if user is the post owner
  if (posts[postIndex].userId !== req.userId) {
    return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("You can only delete your own posts"));
  }

  const deletedPost = posts.splice(postIndex, 1)[0];
  logDebug("Post deleted", { postId: id, userId: req.userId });

  return res.status(HTTP_OK).json({
    message: "Post deleted successfully",
    postId: id,
  });
};

// For testing purposes - get all data
const _getAllData = (req, res) => {
  return res.status(HTTP_OK).json({
    users: users.map((u) => ({ ...u, password: undefined })),
    posts,
    sessions,
  });
};

module.exports = {
  register,
  login,
  logout,
  checkAuth,
  verifyToken,
  createPost,
  getPosts,
  getPostById,
  toggleLike,
  addComment,
  getUserProfile,
  updateProfile,
  toggleFollow,
  searchUsers,
  deletePost,
  _getAllData,
};
