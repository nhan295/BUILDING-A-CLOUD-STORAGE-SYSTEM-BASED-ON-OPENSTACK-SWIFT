
export const getStoredProjectInfo = () => {
  const projectInfo = localStorage.getItem('project_info');
  return projectInfo ? JSON.parse(projectInfo) : null;
};


export const getAvailableDomains = () => {
  return ['Default'];
};

export const getStoredUserInfo = () => {
  const userInfo = localStorage.getItem('user_info');
  return userInfo ? JSON.parse(userInfo) : null;
};
