import { useState, useEffect } from 'react';
import { Upload, TrendingUp, FileText, Folder, Activity, Filter, Calendar } from 'lucide-react';
import { activityLogger } from '../../pages/logic/ActivityLogs';
import '../style/ActivityLogs.css';

export default function ActivityLogs() {
  const [recentActivities, setRecentActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const logs = await activityLogger();
        const formattedLogs = logs.map((log, index) => ({
          id: index + 1,
          type: mapActionToType(log.action),
          user: log.username,
          file: log.details,
          time: new Date(log.time).toLocaleString(),
          timestamp: new Date(log.time),
          size: '-',
          action: log.action
        }));
        setRecentActivities(formattedLogs);
        
        // Apply filters ngay sau khi fetch
        applyFilters(formattedLogs, dateFilter, actionFilter);
      } catch (error) {
        console.error("Error while fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  // Chỉ cần 1 useEffect để handle filter changes
  useEffect(() => {
    applyFilters(recentActivities, dateFilter, actionFilter);
  }, [dateFilter, actionFilter]);

  const mapActionToType = (action) => {
    const a = action.toLowerCase();
    if (a.includes('upload')) return 'upload';
    if (a.includes('download')) return 'download';
    if (a.includes('delete')) return 'delete';
    if (a.includes('create')) return 'create';
    return 'other';
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'upload': return <Upload className="activity-icon upload" />;
      case 'download': return <TrendingUp className="activity-icon download" />;
      case 'delete': return <FileText className="activity-icon delete" />;
      case 'create': return <Folder className="activity-icon create" />;
      default: return <Activity className="activity-icon" />;
    }
  };

  const applyFilters = (activities, dateF, actionF) => {
    let filtered = [...activities];

    // Lọc theo ngày
    if (dateF !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(activity => {
        const activityDate = activity.timestamp;
        
        switch (dateF) {
          case 'today': {
            return activityDate >= today;
          }
          case '3days': {
            const threeDaysAgo = new Date(today);
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            return activityDate >= threeDaysAgo;
          }
          case '7days': {
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return activityDate >= sevenDaysAgo;
          }
          default:
            return true;
        }
      });
    }

    // Lọc theo action
    if (actionF !== 'all') {
      filtered = filtered.filter(activity => activity.type === actionF);
    }

    setFilteredActivities(filtered);
  };

  return (
    <div className="al-container">
      <div className="al-card">
        <div className="al-header">
          <h2>Recent System Activities</h2>
          <div className="al-filter-section">
            <div className="al-filter-group">
              <Calendar className="al-filter-icon" size={16} />
              <select 
                className="al-filter-select"
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="3days">Last 3 Days</option>
                <option value="7days">Last 7 Days</option>
              </select>
            </div>
            
            <div className="al-filter-group">
              <Filter className="al-filter-icon" size={16} />
              <select 
                className="al-filter-select"
                value={actionFilter} 
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="all">All Actions</option>
                <option value="upload">Upload</option>
                <option value="download">Download</option>
                <option value="delete">Delete</option>
                <option value="create">Create</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="al-body">
          {filteredActivities.length > 0 ? (
            <div className="al-list">
              {filteredActivities.map((activity) => (
                <div key={activity.id} className="al-item">
                  <div className="al-icon-wrapper">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="al-details">
                    <p className="al-file">{activity.file}</p>
                    <p className="al-user">{activity.user}</p>
                  </div>
                  <div className="al-meta">
                    <p className="al-size">{activity.size}</p>
                    <p className="al-time">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="al-empty">
              <Activity size={48} />
              <p>No activities found for the selected filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}