const { generateUuid } = require("../../../helpers/helpers");

// Sample users for Chirper app
const sampleUsers = [
  {
    id: generateUuid(),
    username: "johndoe",
    email: "john.doe@example.com",
    password: "password123",
    fullName: "John Doe",
    bio: "Just a simple guy who loves to tweet about technology and coffee.",
    avatar: "/data/users/4b78d31b-637d-4f44-8d82-36b8a08ecbbe.jpg",
    createdAt: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
    followers: [],
    following: [],
  },
  {
    id: generateUuid(),
    username: "janesmith",
    email: "jane.smith@example.com",
    password: "password123",
    fullName: "Jane Smith",
    bio: "Software developer by day, reader by night. Love to share coding tips and book recommendations.",
    avatar: "/data/users/444459e4-73f8-4599-a7e3-23849bbf3ae7.jpg",
    createdAt: new Date(Date.now() - 55 * 60 * 60 * 1000).toISOString(),
    followers: [],
    following: [],
  },
  {
    id: generateUuid(),
    username: "techguru",
    email: "tech.guru@example.com",
    password: "password123",
    fullName: "Tech Guru",
    bio: "I tweet about the latest in tech, AI, and programming languages. Follow for daily tech insights!",
    avatar: "/data/users/e0af6e4f-3e7c-4692-85a2-be9b5b9efc24.jpg",
    createdAt: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
    followers: [],
    following: [],
  },
  {
    id: generateUuid(),
    username: "bookworm",
    email: "book.worm@example.com",
    password: "password123",
    fullName: "Book Worm",
    bio: "Bibliophile sharing thoughts on books, reading, and writing. Recommendations welcome!",
    avatar: "/data/users/e1fd1368-1715-4ffa-8487-d537c7fb6445.jpg",
    createdAt: new Date(Date.now() - 45 * 60 * 60 * 1000).toISOString(),
    followers: [],
    following: [],
  },
];

// Create follow relationships
// User 1 follows User 2 and 3
sampleUsers[0].following.push(sampleUsers[1].id, sampleUsers[2].id);
sampleUsers[1].followers.push(sampleUsers[0].id);
sampleUsers[2].followers.push(sampleUsers[0].id);

// User 2 follows User 3 and 4
sampleUsers[1].following.push(sampleUsers[2].id, sampleUsers[3].id);
sampleUsers[2].followers.push(sampleUsers[1].id);
sampleUsers[3].followers.push(sampleUsers[1].id);

// User 3 follows User 1 and 4
sampleUsers[2].following.push(sampleUsers[0].id, sampleUsers[3].id);
sampleUsers[0].followers.push(sampleUsers[2].id);
sampleUsers[3].followers.push(sampleUsers[2].id);

// User 4 follows User 1
sampleUsers[3].following.push(sampleUsers[0].id);
sampleUsers[0].followers.push(sampleUsers[3].id);

// Sample chirps (tweets)
const sampleChirps = [
  {
    id: generateUuid(),
    userId: sampleUsers[0].id,
    text: "Just started learning React and I'm loving it! Any good resources to recommend?",
    isPrivate: false,
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[1].id,
    text: "Excited to share my latest project on GitHub! It's a simple weather app built with JavaScript.",
    isPrivate: false,
    createdAt: new Date(Date.now() - 70 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[2].id,
    text: "Just attended a webinar on AI and machine learning. The future is here!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 68 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[1].id,
    text: "Just finished a great book on JavaScript. It's amazing how much there is to learn!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 66 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[1].id,
    text: "Working on a new project with Node.js. The community is so helpful!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 64 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[2].id,
    text: "AI is changing the landscape of software development. Exciting times ahead!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 62 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[3].id,
    text: "Just finished 'Clean Code' by Robert Martin. Highly recommend for all developers!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[0].id,
    text: "My secret project is coming along nicely. Can't wait to share more details!",
    isPrivate: true,
    createdAt: new Date(Date.now() - 58 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[1].id,
    text: "Just had an amazing brainstorming session with my team. Ideas flowing!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 56 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[2].id,
    text: "Private update: Working on a new machine learning algorithm. Progress is good!",
    isPrivate: true,
    createdAt: new Date(Date.now() - 54 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[3].id,
    text: "Coffee + coding = perfect morning. What's your productivity formula?",
    isPrivate: false,
    createdAt: new Date(Date.now() - 52 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[0].id,
    text: "Just deployed my first full-stack application! Feeling accomplished. 🚀",
    isPrivate: false,
    createdAt: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[1].id,
    text: "Exploring the world of GraphQL. It's a game changer for APIs!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[2].id,
    text: "Just attended a fantastic webinar on cloud computing. So much to learn!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[3].id,
    text: "Just finished a deep dive into Docker. It's a game changer for deployment!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 44 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[0].id,
    text: "Just started a new book on machine learning. Can't wait to dive in!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 42 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[1].id,
    text: "Just completed a coding challenge on LeetCode. Feeling accomplished!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[2].id,
    text: "Just had a great discussion about the future of AI with some colleagues. Exciting times ahead!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 38 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[3].id,
    text: "Just finished a project on web accessibility. It's so important to make the web inclusive for everyone!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[0].id,
    text: "Debugging a tricky issue in my React app. Sometimes the best solutions come after a good night's sleep! 💤",
    isPrivate: false,
    createdAt: new Date(Date.now() - 34 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[1].id,
    text: "Just discovered VS Code extensions that are game changers. Productivity level: over 9000! 🚀",
    isPrivate: false,
    createdAt: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[2].id,
    text: "Attended my first tech conference today. The networking opportunities are incredible!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[3].id,
    text: "Currently reading 'The Phoenix Project' - such great insights on DevOps and IT operations!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[0].id,
    text: "Personal milestone: Finally understand how async/await really works in JavaScript! 🎉",
    isPrivate: true,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[1].id,
    text: "Working on improving my git workflow. Branching strategies are more important than I thought!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[2].id,
    text: "Just implemented my first neural network from scratch. The math is complex but fascinating!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[3].id,
    text: "Weekend reading: exploring the history of programming languages. COBOL is older than I thought!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[0].id,
    text: "Just set up my first CI/CD pipeline. Automation is truly magical! ✨",
    isPrivate: false,
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[1].id,
    text: "Experimenting with microservices architecture. The complexity is both exciting and terrifying!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[2].id,
    text: "Secret project update: The AI model is showing promising results in early testing!",
    isPrivate: true,
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[3].id,
    text: "Just finished a book on typography and web design. Good design is invisible until it's not!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[0].id,
    text: "Learning Rust and my brain hurts in the best way possible. The borrow checker is strict but fair!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[1].id,
    text: "Just contributed to my first open source project! The community is so welcoming. 🤝",
    isPrivate: false,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[2].id,
    text: "Database optimization day! Reduced query time from 2 seconds to 50ms. Small victories! 🎯",
    isPrivate: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[3].id,
    text: "Reading recommendation: 'Don't Make Me Think' by Steve Krug. UX principles that every developer should know!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[0].id,
    text: "Late night coding session: building a personal project that I'm actually excited about! 🌙",
    isPrivate: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[1].id,
    text: "Just learned about Web Components. Native browser APIs keep getting better!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[2].id,
    text: "Pair programming session went great today. Two minds really are better than one!",
    isPrivate: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
  {
    id: generateUuid(),
    userId: sampleUsers[3].id,
    text: "Personal note: Remember to take breaks. Code will still be there after a walk in the park! 🌳",
    isPrivate: true,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    likes: [],
    replies: [],
  },
];

// Add some likes to chirps
// User 1 (johndoe) likes various chirps
sampleChirps[1].likes.push(sampleUsers[0].id); // Weather app
sampleChirps[2].likes.push(sampleUsers[0].id); // AI webinar
sampleChirps[6].likes.push(sampleUsers[0].id); // Clean Code book
sampleChirps[11].likes.push(sampleUsers[0].id); // Full-stack app
sampleChirps[20].likes.push(sampleUsers[0].id); // VS Code extensions
sampleChirps[25].likes.push(sampleUsers[0].id); // Neural network
sampleChirps[27].likes.push(sampleUsers[0].id); // CI/CD pipeline
sampleChirps[32].likes.push(sampleUsers[0].id); // Open source

// User 2 (janesmith) likes various chirps
sampleChirps[0].likes.push(sampleUsers[1].id); // React learning
sampleChirps[2].likes.push(sampleUsers[1].id); // AI webinar
sampleChirps[3].likes.push(sampleUsers[1].id); // JavaScript book
sampleChirps[12].likes.push(sampleUsers[1].id); // GraphQL
sampleChirps[21].likes.push(sampleUsers[1].id); // Tech conference
sampleChirps[24].likes.push(sampleUsers[1].id); // Git workflow
sampleChirps[31].likes.push(sampleUsers[1].id); // Rust learning
sampleChirps[33].likes.push(sampleUsers[1].id); // Database optimization
sampleChirps[36].likes.push(sampleUsers[1].id); // Web Components

// User 3 (techguru) likes various chirps
sampleChirps[0].likes.push(sampleUsers[2].id); // React learning
sampleChirps[1].likes.push(sampleUsers[2].id); // Weather app
sampleChirps[4].likes.push(sampleUsers[2].id); // Node.js project
sampleChirps[5].likes.push(sampleUsers[2].id); // AI development
sampleChirps[14].likes.push(sampleUsers[2].id); // Docker
sampleChirps[22].likes.push(sampleUsers[2].id); // Phoenix Project
sampleChirps[28].likes.push(sampleUsers[2].id); // Microservices
sampleChirps[30].likes.push(sampleUsers[2].id); // Typography book
sampleChirps[37].likes.push(sampleUsers[2].id); // Pair programming

// User 4 (bookworm) likes various chirps
sampleChirps[3].likes.push(sampleUsers[3].id); // JavaScript book
sampleChirps[6].likes.push(sampleUsers[3].id); // Clean Code book
sampleChirps[15].likes.push(sampleUsers[3].id); // ML book
sampleChirps[22].likes.push(sampleUsers[3].id); // Phoenix Project
sampleChirps[26].likes.push(sampleUsers[3].id); // Programming history
sampleChirps[30].likes.push(sampleUsers[3].id); // Typography book
sampleChirps[34].likes.push(sampleUsers[3].id); // UX book recommendation
sampleChirps[35].likes.push(sampleUsers[3].id); // Late night coding

// Add some replies to chirps
// Replies to React learning chirp (index 0)
sampleChirps[0].replies.push({
  id: generateUuid(),
  userId: sampleUsers[1].id,
  text: "Check out the React docs and freecodecamp.org, they're great for beginners!",
  createdAt: new Date(Date.now() - 71 * 60 * 60 * 1000).toISOString(),
});

sampleChirps[0].replies.push({
  id: generateUuid(),
  userId: sampleUsers[2].id,
  text: "I'd recommend Egghead.io or Frontend Masters for more advanced tutorials.",
  createdAt: new Date(Date.now() - 70.5 * 60 * 60 * 1000).toISOString(),
});

sampleChirps[0].replies.push({
  id: generateUuid(),
  userId: sampleUsers[3].id,
  text: "Also try building small projects - that's how I learned best!",
  createdAt: new Date(Date.now() - 70 * 60 * 60 * 1000).toISOString(),
});

// Replies to AI webinar chirp (index 2)
sampleChirps[2].replies.push({
  id: generateUuid(),
  userId: sampleUsers[0].id,
  text: "Absolutely! The way AI is integrating with development tools is fascinating.",
  createdAt: new Date(Date.now() - 67 * 60 * 60 * 1000).toISOString(),
});

sampleChirps[2].replies.push({
  id: generateUuid(),
  userId: sampleUsers[1].id,
  text: "Which specific topics did they cover? I'm trying to get into ML myself.",
  createdAt: new Date(Date.now() - 66.5 * 60 * 60 * 1000).toISOString(),
});

// Replies to JavaScript book chirp (index 3)
sampleChirps[3].replies.push({
  id: generateUuid(),
  userId: sampleUsers[2].id,
  text: "Which book was it? I'm always looking for good JS resources.",
  createdAt: new Date(Date.now() - 65 * 60 * 60 * 1000).toISOString(),
});

sampleChirps[3].replies.push({
  id: generateUuid(),
  userId: sampleUsers[3].id,
  text: "Have you read 'Eloquent JavaScript'? It's fantastic for understanding the language deeply.",
  createdAt: new Date(Date.now() - 64.5 * 60 * 60 * 1000).toISOString(),
});

// Replies to productivity formula chirp (index 10)
sampleChirps[10].replies.push({
  id: generateUuid(),
  userId: sampleUsers[0].id,
  text: "For me it's tea + music + coding in blocks of 25 minutes. Works like a charm!",
  createdAt: new Date(Date.now() - 51 * 60 * 60 * 1000).toISOString(),
});

sampleChirps[10].replies.push({
  id: generateUuid(),
  userId: sampleUsers[1].id,
  text: "I prefer morning sessions with fresh air and no distractions. Coffee is a must! ☕",
  createdAt: new Date(Date.now() - 50.5 * 60 * 60 * 1000).toISOString(),
});

sampleChirps[10].replies.push({
  id: generateUuid(),
  userId: sampleUsers[2].id,
  text: "Late night coding with lo-fi music hits different. Peak creativity time!",
  createdAt: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
});

// Replies to full-stack deployment chirp (index 11)
sampleChirps[11].replies.push({
  id: generateUuid(),
  userId: sampleUsers[2].id,
  text: "Congrats! What tech stack did you use? Always curious about others' choices.",
  createdAt: new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString(),
});

sampleChirps[11].replies.push({
  id: generateUuid(),
  userId: sampleUsers[3].id,
  text: "That feeling never gets old! Each deployment feels like a small victory 🎉",
  createdAt: new Date(Date.now() - 48.5 * 60 * 60 * 1000).toISOString(),
});

// Replies to VS Code extensions chirp (index 20)
sampleChirps[20].replies.push({
  id: generateUuid(),
  userId: sampleUsers[2].id,
  text: "Which extensions would you recommend? Always looking for new productivity boosters!",
  createdAt: new Date(Date.now() - 31 * 60 * 60 * 1000).toISOString(),
});

sampleChirps[20].replies.push({
  id: generateUuid(),
  userId: sampleUsers[0].id,
  text: "GitLens and Prettier are absolute game changers. Also try Thunder Client!",
  createdAt: new Date(Date.now() - 30.5 * 60 * 60 * 1000).toISOString(),
});

// Replies to tech conference chirp (index 21)
sampleChirps[21].replies.push({
  id: generateUuid(),
  userId: sampleUsers[3].id,
  text: "Which conference was it? I'm looking for good ones to attend next year.",
  createdAt: new Date(Date.now() - 29 * 60 * 60 * 1000).toISOString(),
});

sampleChirps[21].replies.push({
  id: generateUuid(),
  userId: sampleUsers[0].id,
  text: "The networking aspect is often more valuable than the talks themselves!",
  createdAt: new Date(Date.now() - 28.5 * 60 * 60 * 1000).toISOString(),
});

// Replies to neural network chirp (index 25)
sampleChirps[25].replies.push({
  id: generateUuid(),
  userId: sampleUsers[1].id,
  text: "That's impressive! Did you use TensorFlow or build everything from scratch?",
  createdAt: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString(),
});

sampleChirps[25].replies.push({
  id: generateUuid(),
  userId: sampleUsers[3].id,
  text: "The math behind neural networks is beautiful once you understand it. Great work!",
  createdAt: new Date(Date.now() - 20.5 * 60 * 60 * 1000).toISOString(),
});

// Replies to CI/CD pipeline chirp (index 27)
sampleChirps[27].replies.push({
  id: generateUuid(),
  userId: sampleUsers[1].id,
  text: "Which tools did you use? I'm setting up my first pipeline next week.",
  createdAt: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
});

sampleChirps[27].replies.push({
  id: generateUuid(),
  userId: sampleUsers[2].id,
  text: "Automation really is magical! Wait until you set up automated testing too 🧪",
  createdAt: new Date(Date.now() - 16.5 * 60 * 60 * 1000).toISOString(),
});

// Replies to open source contribution chirp (index 32)
sampleChirps[32].replies.push({
  id: generateUuid(),
  userId: sampleUsers[3].id,
  text: "Congratulations! Open source contributions are so rewarding. What project was it?",
  createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
});

sampleChirps[32].replies.push({
  id: generateUuid(),
  userId: sampleUsers[0].id,
  text: "The open source community really is amazing. Your first contribution is always special!",
  createdAt: new Date(Date.now() - 6.5 * 60 * 60 * 1000).toISOString(),
});

// Replies to database optimization chirp (index 33)
sampleChirps[33].replies.push({
  id: generateUuid(),
  userId: sampleUsers[0].id,
  text: "Amazing optimization! Those performance wins always feel so satisfying.",
  createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
});

sampleChirps[33].replies.push({
  id: generateUuid(),
  userId: sampleUsers[1].id,
  text: "50ms is incredible! Did you add indexes or rewrite the queries?",
  createdAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
});

// Replies to UX book recommendation chirp (index 34)
sampleChirps[34].replies.push({
  id: generateUuid(),
  userId: sampleUsers[1].id,
  text: "Adding this to my reading list! UX knowledge is so valuable for developers.",
  createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
});

// Replies to pair programming chirp (index 37)
sampleChirps[37].replies.push({
  id: generateUuid(),
  userId: sampleUsers[2].id,
  text: "Pair programming is underrated! Some of my best code came from collaboration sessions.",
  createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
});

sampleChirps[37].replies.push({
  id: generateUuid(),
  userId: sampleUsers[0].id,
  text: "Knowledge sharing in real-time is so powerful. Plus, fewer bugs make it to production!",
  createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
});

module.exports = {
  sampleUsers,
  sampleChirps,
};
