import React from "react";
import { HardDrive, Users, BarChart3, Trash2, Upload, Download } from "lucide-react";

// Dữ liệu mẫu nếu không truyền prop
const sampleFiles = [
  { id: 1, name: "file1.txt", size: "10 MB", date: "2025-10-01", owner: "user1" },
  { id: 2, name: "file2.jpg", size: "20 MB", date: "2025-10-02", owner: "user2" },
];

export default function Dashboard(props) {
  // Destructure inside function body to avoid parser issues in parameter list
  const {
    role = "admin",
    files = sampleFiles,
    handleDeleteFile = () => {},
  } = props || {};

  return (
    <div className="flex-1 overflow-auto bg-slate-900">
      {role === "admin" ? (
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h2>
            <p className="text-slate-400">Quản lý hệ thống lưu trữ Swift</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 p-6 rounded-2xl hover:border-cyan-500/50 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-2">Tổng dung lượng</p>
                  <p className="text-3xl font-bold text-white">2.5 TB</p>
                </div>
                <div className="bg-cyan-500/20 p-3 rounded-lg">
                  <HardDrive size={32} className="text-cyan-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 p-6 rounded-2xl hover:border-green-500/50 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-2">Số lượng Users</p>
                  <p className="text-3xl font-bold text-white">24</p>
                </div>
                <div className="bg-green-500/20 p-3 rounded-lg">
                  <Users size={32} className="text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 p-6 rounded-2xl hover:border-orange-500/50 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-2">Dung lượng sử dụng</p>
                  <p className="text-3xl font-bold text-white">1.8 TB</p>
                </div>
                <div className="bg-orange-500/20 p-3 rounded-lg">
                  <BarChart3 size={32} className="text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* User Management */}
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Danh sách Users</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Username</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Email</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Dung lượng</th>
                    <th className="px-4 py-3 text-left text-slate-300 font-semibold">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-600 hover:bg-slate-700/50 transition">
                    <td className="px-4 py-3 text-white">user1</td>
                    <td className="px-4 py-3 text-slate-300">user1@example.com</td>
                    <td className="px-4 py-3 text-slate-300">500 GB</td>
                    <td className="px-4 py-3">
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-xs font-semibold">Active</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Files */}
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Tất cả Files</h3>
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition border border-slate-600">
                  <div className="flex-1">
                    <p className="font-semibold text-white">{file.name}</p>
                    <p className="text-sm text-slate-400">{file.size} • {file.date} • Owner: {file.owner}</p>
                  </div>
                  <button onClick={() => handleDeleteFile(file.id)} className="text-red-400 hover:text-red-300 transition">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-white mb-2">My Storage</h2>
            <p className="text-slate-400">Quản lý files của bạn</p>
          </div>

          {/* Storage Info */}
          <div className="bg-slate-800 border border-slate-600 p-6 rounded-2xl mb-8">
            <div className="mb-4">
              <div className="flex justify-between mb-3">
                <p className="text-slate-300 font-semibold">Dung lượng sử dụng</p>
                <p className="text-cyan-400 font-bold">120 GB / 500 GB</p>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-600 h-3 rounded-full" style={{ width: "24%" }} />
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div className="bg-slate-800 border-2 border-dashed border-cyan-500/50 rounded-2xl p-12 mb-8 text-center hover:border-cyan-400 hover:bg-slate-700/50 transition cursor-pointer">
            <div className="bg-cyan-500/20 p-4 rounded-xl inline-block mb-3">
              <Upload size={40} className="text-cyan-400" />
            </div>
            <p className="text-white font-semibold mb-2">Kéo và thả files hoặc click để upload</p>
            <p className="text-sm text-slate-400">Tối đa: 10 GB/file</p>
          </div>

          {/* Files List */}
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">My Files</h3>
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition border border-slate-600">
                  <div className="flex-1">
                    <p className="font-semibold text-white">{file.name}</p>
                    <p className="text-sm text-slate-400">{file.size} • {file.date}</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="text-cyan-400 hover:text-cyan-300 transition">
                      <Download size={20} />
                    </button>
                    <button onClick={() => handleDeleteFile(file.id)} className="text-red-400 hover:text-red-300 transition">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
