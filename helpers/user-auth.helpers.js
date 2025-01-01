const userBaseAuth = {
  isAdmin: false,
  isSuperAdmin: false,
  manageAllRoles: false,
  manageAllUsers: false,
  manageAllArticles: false,
  manageAllComments: false,
};

function updateUserActions(userAuth, allActions) {
  const newAuth = { ...userBaseAuth, ...userAuth, ...allActions };
  return newAuth;
}

function getAdminAuth() {
  const newAuth = { ...userBaseAuth };
  for (const key in newAuth) {
    newAuth[key] = true;
  }
  return newAuth;
}

module.exports = {
  userBaseAuth,
  updateUserActions,
  getAdminAuth,
};
