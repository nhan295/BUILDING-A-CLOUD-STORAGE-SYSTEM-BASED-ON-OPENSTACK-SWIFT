import "../style/Dashboard.css";
import { HardDrive, Users, BarChart3, Trash2 } from "lucide-react";

const sampleFiles = [
  { id: 1, name: "report.docx", size: "10 MB", owner: "user1" },
  { id: 2, name: "photo.jpg", size: "5 MB", owner: "user2" },
  { id: 3, name: "data.csv", size: "15 MB", owner: "user3" },
];

export default function Dashboard({ role = "admin", files = sampleFiles }) {
  return (
    <div className="dashboard">
      <h2 className="dashboard-title">
        {role === "admin" ? "Admin Dashboard" : "User Dashboard"}
      </h2>

      <div className="stats">
        <div className="stat-box">
          <HardDrive className="icon blue" />
          <div>
            <p className="label">Tổng dung lượng</p>
            <p className="value">2.5 TB</p>
          </div>
        </div>
        <div className="stat-box">
          <Users className="icon green" />
          <div>
            <p className="label">Số lượng user</p>
            <p className="value">24</p>
          </div>
        </div>
        <div className="stat-box">
          <BarChart3 className="icon orange" />
          <div>
            <p className="label">Dung lượng sử dụng</p>
            <p className="value">1.8 TB</p>
          </div>
        </div>
      </div>

      <div className="table">
        <h3>Danh sách files</h3>
        <table>
          <thead>
            <tr>
              <th>Tên file</th>
              <th>Dung lượng</th>
              <th>Chủ sở hữu</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id}>
                <td>{file.name}</td>
                <td>{file.size}</td>
                <td>{file.owner}</td>
                <td>
                  <button className="delete-btn">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
