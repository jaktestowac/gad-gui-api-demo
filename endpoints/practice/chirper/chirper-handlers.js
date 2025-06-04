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
const { sampleUsers, sampleChirps } = require("./chirper-data");

// In-memory storage for users, chirps, and sessions
const users = [];
const chirps = [];
const sessions = [];
const SECRET_KEY = "chirper-secret-key-2025";
const POST_MAX_LENGTH = 128; // Maximum length for chirp text

// Add sample data to the in-memory storage
sampleUsers.forEach((user) => {
  users.push(user);
});

sampleChirps.forEach((chirp) => {
  chirps.push(chirp);
});

// Helper to generate token
const generateToken = (userId) => {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: "24h" });
};

// Validate token from cookies or Authorization header
const isTokenValid = (req, res) => {
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

  if (!token) {
    return { isValid: false, message: "No token provided" };
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.userId;

    // Check if user exists
    const user = users.find((u) => u.id === decoded.userId);
    if (!user) {
      return { isValid: false, message: "Session expired or invalid. Please log in again." };
    }
    return { isValid: true, userId: decoded.userId };
  } catch (error) {
    return { isValid: false, message: "Session expired or invalid. Please log in again." };
  }
};

// Middleware to verify token
const verifyToken = (req, res, next) => {
  // Check if token is valid
  const tokenValidation = isTokenValid(req, res);
  if (!tokenValidation.isValid) {
    return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse(tokenValidation.message));
  }
  // If token is valid, set userId in request
  req.userId = tokenValidation.userId;
  // Call the next middleware or route handler
  return next(req, res);
};

// User registration
const register = (req, res) => {
  const { username, email, password, fullName } = req.body;
  // Validate required fields
  if (!username || !email || !password) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Missing required fields"));
  }

  // Validate field lengths (3-32 characters)
  if (username.length < 3 || username.length > 32) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Username must be between 3 and 32 characters"));
  }

  if (email.length < 3 || email.length > 32) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Email must be between 3 and 32 characters"));
  }

  if (password.length < 3 || password.length > 32) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Password must be between 3 and 32 characters"));
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Invalid email format"));
  }
  // Validate username (letters, numbers, underscores, hyphens)
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return res
      .status(HTTP_BAD_REQUEST)
      .send(formatErrorResponse("Username can only contain letters, numbers, underscores, and hyphens"));
  }

  // Validate fullName length if provided
  if (fullName && fullName.length > 32) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Full name is too long (maximum 32 characters)"));
  }

  // Check if user already exists
  const existingUser = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
  );
  if (existingUser) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Username or email already in use"));
  }

  const newUser = {
    id: generateUuid(),
    username,
    email,
    avatar: `/data/users/_default.png`,
    password, // Note: In a real app, you would hash the password
    fullName: fullName || username,
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

  // Validate field lengths (3-32 characters)
  if (username.length < 3 || username.length > 32) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Username must be between 3 and 32 characters"));
  }

  if (password.length < 3 || password.length > 32) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Password must be between 3 and 32 characters"));
  }

  // Find user - case insensitive for username and email
  const user = users.find(
    (u) =>
      (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()) &&
      u.password === password
  );

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

// Create a new chirp
const createChirp = (req, res) => {
  const { text, isPrivate } = req.body;

  if (!text) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Chirp text is required"));
  }

  // Validate text length (maximum POST_MAX_LENGTH characters)
  if (text.length > POST_MAX_LENGTH) {
    return res
      .status(HTTP_BAD_REQUEST)
      .send(formatErrorResponse(`Chirp text cannot exceed ${POST_MAX_LENGTH} characters`));
  }

  const newChirp = {
    id: generateUuid(),
    userId: req.userId,
    text,
    isPrivate: isPrivate === true, // Convert to boolean, default to false
    createdAt: new Date().toISOString(),
    likes: [],
    replies: [],
  };

  chirps.push(newChirp);
  logDebug("Chirp created", { chirpId: newChirp.id, userId: req.userId });
  // Add user data to the chirp
  const chirpUser = users.find((u) => u.id === req.userId);
  if (chirpUser) {
    newChirp.username = chirpUser.username;
    newChirp.userFullName = chirpUser.fullName;
    newChirp.userAvatar = chirpUser.avatar;
  }

  return res.status(HTTP_CREATED).json(newChirp);
};

// Get all chirps (feed)
const getChirps = (req, res) => {
  // Check if user is authenticated
  const isAuthenticated = isTokenValid(req, res).isValid;
  const authenticatedUserId = isAuthenticated ? req.userId : null;

  // Get pagination parameters
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const before = req.query.before; // Timestamp to paginate before

  // Filter chirps - show all public chirps
  // For authenticated users, also show private chirps from people they follow
  let filteredChirps = chirps.filter((chirp) => {
    // Always include public chirps
    if (!chirp.isPrivate) {
      return true;
    }

    // For private chirps, only show if user is authenticated and follows the author
    if (isAuthenticated) {
      const currentUser = users.find((u) => u.id === authenticatedUserId);
      return currentUser && currentUser.following.includes(chirp.userId);
    }

    return false;
  });

  // Sort by creation date (newest first)
  filteredChirps = filteredChirps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Apply pagination based on timestamp if provided
  if (before) {
    try {
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) {
        logDebug("> Filtering by timestamp", { before, beforeDate });
        filteredChirps = filteredChirps.filter((chirp) => new Date(chirp.createdAt) < beforeDate);
      } else {
        logDebug("> Invalid before timestamp", { before });
      }
    } catch (err) {
      logDebug("> Error parsing timestamp", { before, error: err.message });
    }
  }
  // When using timestamp pagination (before), don't use offset
  // When using offset pagination, don't use before timestamp
  let paginatedChirps;
  let hasMore;

  if (before) {
    // Timestamp-based pagination: just take the limit, no offset
    paginatedChirps = filteredChirps.slice(0, limit);
    // Check if there are more chirps beyond this batch
    hasMore = filteredChirps.length > limit;
  } else {
    // Offset-based pagination
    paginatedChirps = filteredChirps.slice(offset, offset + limit);
    hasMore = offset + limit < filteredChirps.length;
  } // Add user data to each chirp
  paginatedChirps.forEach((chirp) => {
    const chirpUser = users.find((u) => u.id === chirp.userId);
    if (chirpUser) {
      chirp.username = chirpUser.username;
      chirp.userFullName = chirpUser.fullName;
      chirp.userAvatar = chirpUser.avatar;
    }

    // Add user data to each reply
    if (chirp.replies && chirp.replies.length > 0) {
      chirp.replies.forEach((reply) => {
        const replyUser = users.find((u) => u.id === reply.userId);
        if (replyUser) {
          reply.username = replyUser.username;
          reply.userFullName = replyUser.fullName;
          reply.userAvatar = replyUser.avatar;
        }
      });
    }
  });

  return res.status(HTTP_OK).json({
    chirps: paginatedChirps,
    hasMore,
    total: filteredChirps.length,
  });
};

// Get a single chirp by ID
const getChirpById = (req, res) => {
  const { id } = req.params;
  const chirp = chirps.find((p) => p.id === id);

  if (!chirp) {
    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Chirp not found"));
  }

  // Check if private and if user is allowed to see it
  if (chirp.isPrivate) {
    const isAuthenticated = isTokenValid(req, res).isValid;

    if (!isAuthenticated) {
      return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("You must be logged in to view this chirp"));
    }

    const currentUser = users.find((u) => u.id === req.userId);
    if (!currentUser.following.includes(chirp.userId) && chirp.userId !== req.userId) {
      return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("You don't have access to this chirp"));
    }
  }

  // Add user data to the chirp
  const chirpUser = users.find((u) => u.id === chirp.userId);
  if (chirpUser) {
    chirp.username = chirpUser.username;
    chirp.userFullName = chirpUser.fullName;
    chirp.userAvatar = chirpUser.avatar;
  }

  // Add user data to each reply
  if (chirp.replies && chirp.replies.length > 0) {
    chirp.replies.forEach((reply) => {
      const replyUser = users.find((u) => u.id === reply.userId);
      if (replyUser) {
        reply.username = replyUser.username;
        reply.userFullName = replyUser.fullName;
        reply.userAvatar = replyUser.avatar;
      }
    });
  }

  return res.status(HTTP_OK).json(chirp);
};

// Like/unlike a chirp
const toggleLike = (req, res) => {
  const { id } = req.params;
  const chirp = chirps.find((p) => p.id === id);

  if (!chirp) {
    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Chirp not found"));
  }

  // Check if private and if user is allowed to see it
  if (chirp.isPrivate) {
    const currentUser = users.find((u) => u.id === req.userId);
    if (!currentUser.following.includes(chirp.userId) && chirp.userId !== req.userId) {
      return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("You don't have access to this chirp"));
    }
  }

  // Check if user already liked the chirp
  const likeIndex = chirp.likes.indexOf(req.userId);

  if (likeIndex === -1) {
    // Add like
    chirp.likes.push(req.userId);
    logDebug("Chirp liked", { chirpId: chirp.id, userId: req.userId });
  } else {
    // Remove like
    chirp.likes.splice(likeIndex, 1);
    logDebug("Chirp unliked", { chirpId: chirp.id, userId: req.userId });
  }
  // Add user data to the chirp
  const chirpUser = users.find((u) => u.id === chirp.userId);
  if (chirpUser) {
    chirp.username = chirpUser.username;
    chirp.userFullName = chirpUser.fullName;
    chirp.userAvatar = chirpUser.avatar;
  }

  // Add user data to each reply
  if (chirp.replies && chirp.replies.length > 0) {
    chirp.replies.forEach((reply) => {
      const replyUser = users.find((u) => u.id === reply.userId);
      if (replyUser) {
        reply.username = replyUser.username;
        reply.userFullName = replyUser.fullName;
        reply.userAvatar = replyUser.avatar;
      }
    });
  }

  return res.status(HTTP_OK).json(chirp);
};

// Add reply to a chirp
const addReply = (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Reply text is required"));
  }

  // Validate text length (maximum POST_MAX_LENGTH characters)
  if (text.length > POST_MAX_LENGTH) {
    return res
      .status(HTTP_BAD_REQUEST)
      .send(formatErrorResponse(`Reply text cannot exceed ${POST_MAX_LENGTH} characters`));
  }

  const chirp = chirps.find((p) => p.id === id);

  if (!chirp) {
    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Chirp not found"));
  }

  // Check if private and if user is allowed to see it
  if (chirp.isPrivate) {
    const currentUser = users.find((u) => u.id === req.userId);
    if (!currentUser.following.includes(chirp.userId) && chirp.userId !== req.userId) {
      return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("You don't have access to this chirp"));
    }
  }

  const user = users.find((u) => u.id === req.userId);

  const newReply = {
    id: generateUuid(),
    userId: req.userId,
    text,
    createdAt: new Date().toISOString(),
  };

  chirp.replies.push(newReply);
  logDebug("Reply added", { chirpId: chirp.id, replyId: newReply.id, userId: req.userId });
  // Add user data to the reply
  newReply.username = user.username;
  newReply.userFullName = user.fullName;
  newReply.userAvatar = user.avatar;

  return res.status(HTTP_CREATED).json(newReply);
};

// Get user profile
const getUserProfile = (req, res) => {
  const { username } = req.params;
  const user = users.find((u) => u.username === username);

  if (!user) {
    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
  }

  // Get pagination parameters
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const before = req.query.before; // Timestamp to paginate before

  // Check if user is authenticated
  const isAuthenticated = isTokenValid(req, res).isValid;
  const authenticatedUserId = isAuthenticated ? req.userId : null;

  // Get user's chirps
  let userChirps = chirps.filter((chirp) => chirp.userId === user.id);

  // Filter out private chirps if not authenticated or not following
  if (!isAuthenticated) {
    userChirps = userChirps.filter((chirp) => !chirp.isPrivate);
  } else if (authenticatedUserId !== user.id) {
    // If viewing someone else's profile, only show private chirps if following them
    const currentUser = users.find((u) => u.id === authenticatedUserId);
    if (!currentUser.following.includes(user.id)) {
      userChirps = userChirps.filter((chirp) => !chirp.isPrivate);
    }
  }
  // Sort by creation date (newest first)
  userChirps = userChirps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Apply pagination based on timestamp if provided
  if (before) {
    try {
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) {
        logDebug("> Profile: Filtering by timestamp", { before, beforeDate });
        userChirps = userChirps.filter((chirp) => new Date(chirp.createdAt) < beforeDate);
      } else {
        logDebug("> Profile: Invalid before timestamp", { before });
      }
    } catch (err) {
      logDebug("> Profile: Error parsing timestamp", { before, error: err.message });
    }
  }
  // When using timestamp pagination (before), don't use offset
  // When using offset pagination, don't use before timestamp
  let paginatedChirps;
  let hasMore;

  if (before) {
    // Timestamp-based pagination: just take the limit, no offset
    paginatedChirps = userChirps.slice(0, limit);
    // Check if there are more chirps beyond this batch
    hasMore = userChirps.length > limit;
  } else {
    // Offset-based pagination
    paginatedChirps = userChirps.slice(offset, offset + limit);
    hasMore = offset + limit < userChirps.length;
  } // Add user data to each chirp for consistency
  paginatedChirps.forEach((chirp) => {
    chirp.username = user.username;
    chirp.userFullName = user.fullName;
    chirp.userAvatar = user.avatar;

    // Add user data to each reply
    if (chirp.replies && chirp.replies.length > 0) {
      chirp.replies.forEach((reply) => {
        const replyUser = users.find((u) => u.id === reply.userId);
        if (replyUser) {
          reply.username = replyUser.username;
          reply.userFullName = replyUser.fullName;
          reply.userAvatar = replyUser.avatar;
        }
      });
    }
  });

  // Check if authenticated user is following this user
  const isFollowing = isAuthenticated
    ? users.find((u) => u.id === authenticatedUserId).following.includes(user.id)
    : false;

  return res.status(HTTP_OK).json({
    user: { ...user, password: undefined },
    chirps: paginatedChirps,
    isFollowing,
    followersCount: user.followers.length,
    followingCount: user.following.length,
    hasMore,
    total: userChirps.length,
  });
};

// Update user profile
const updateProfile = (req, res) => {
  const { fullName, bio, avatar } = req.body;

  logDebug("Update profile", { userId: req.userId, fullName, bio, avatar });

  // Validate input field lengths
  if (fullName && fullName.length > 32) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Full name is too long (maximum 32 characters)"));
  }

  if (bio && bio.length > 160) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("Bio is too long (maximum 160 characters)"));
  }

  const userIndex = users.findIndex((u) => u.id === req.userId);

  if (userIndex === -1) {
    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
  }

  const updatedUser = {
    ...users[userIndex],
    fullName: fullName || users[userIndex].fullName,
    bio: bio !== undefined ? bio : users[userIndex].bio,
    avatar: avatar || users[userIndex].avatar,
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

  if (users.find((u) => u.id === req.userId).username.toLowerCase() === username.toLowerCase()) {
    return res.status(HTTP_BAD_REQUEST).send(formatErrorResponse("You cannot follow yourself"));
  }

  const targetUser = users.find((u) => u.username.toLowerCase() === username.toLowerCase());

  if (!targetUser) {
    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("User not found"));
  }

  const currentUser = users.find((u) => u.id === req.userId);

  // Check if already following
  const isFollowing = currentUser.following.includes(targetUser.id);

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
    }));

  return res.status(HTTP_OK).json(searchResults);
};

// Delete a chirp (only the owner can delete)
const deleteChirp = (req, res) => {
  const { id } = req.params;

  const chirpIndex = chirps.findIndex((p) => p.id === id);

  if (chirpIndex === -1) {
    return res.status(HTTP_NOT_FOUND).send(formatErrorResponse("Chirp not found"));
  }

  // Check if user is the chirp owner
  if (chirps[chirpIndex].userId !== req.userId) {
    return res.status(HTTP_UNAUTHORIZED).send(formatErrorResponse("You can only delete your own chirps"));
  }

  chirps.splice(chirpIndex, 1);
  logDebug("Chirp deleted", { chirpId: id, userId: req.userId });

  return res.status(HTTP_OK).json({
    message: "Chirp deleted successfully",
    chirpId: id,
  });
};

// For testing purposes - get all data
const _getAllData = (req, res) => {
  return res.status(HTTP_OK).json({
    users: users.map((u) => ({ ...u, password: undefined })),
    chirps,
    sessions,
  });
};

module.exports = {
  register,
  login,
  logout,
  checkAuth,
  verifyToken,
  createChirp,
  getChirps,
  getChirpById,
  toggleLike,
  addReply,
  getUserProfile,
  updateProfile,
  toggleFollow,
  searchUsers,
  deleteChirp,
  _getAllData,
};
