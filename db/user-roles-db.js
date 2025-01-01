const roles = [
  {
    id: 1,
    name: "admin",
  },
  {
    id: 2,
    name: "moderator",
  },
  {
    id: 3,
    name: "user",
  },
];

const actions = [
  {
    id: 1,
    name: "manageAllRoles",
    role_ids: [1],
  },
  {
    id: 2,
    name: "manageAllArticles",
    role_ids: [1, 2],
  },
  {
    id: 3,
    name: "manageAllUsers",
    role_ids: [1],
  },
  {
    id: 4,
    name: "manageAllComments",
    role_ids: [1, 2],
  },
];

module.exports = {
  roles,
  actions,
};
