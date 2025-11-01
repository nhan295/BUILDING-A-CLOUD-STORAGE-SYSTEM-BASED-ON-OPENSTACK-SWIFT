import {
  getStoredUserInfo,
  getStoredProjectInfo
} from "../../pages/logic/Profile";

import '../style/Profile.css';

export default function Profile() {

  const user = getStoredUserInfo();
  const project = getStoredProjectInfo();
  const lastLogin = localStorage.getItem('previous_login');

  const userData = {
    userId: user?.user_id || 'N/A',
    username: user?.username || 'N/A',
    project: project?.name || 'N/A',
    domain: project?.domain || 'N/A',
    lastLogin: lastLogin
      ? new Date(lastLogin).toLocaleString()
      : 'N/A'
  };

  const infoFields = [
    { key: 'pf-user-id', label: 'User ID', value: userData.userId },
    { key: 'pf-username', label: 'Username', value: userData.username },
    { key: 'pf-project', label: 'Project', value: userData.project },
    { key: 'pf-domain', label: 'Domain', value: userData.domain },
    { key: 'pf-last-login', label: 'Last Login', value: userData.lastLogin }
  ];

  return (
    <div className="pf-container">
      <div className="pf-card">
        <div className="pf-header">
          <h1>Thông Tin Người Dùng</h1>
        </div>

        <div className="pf-content">
          <div className="pf-info-section">
            {infoFields.map(field => (
              <div key={field.key} className="pf-info-item">
                <label className="pf-label">{field.label}</label>
                <div className="pf-value">{field.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}