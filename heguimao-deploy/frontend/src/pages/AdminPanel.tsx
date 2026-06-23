import { useState, useEffect } from "react";
import { getUsers, deleteUser, updateUserRole, type User as UserType } from "../lib/auth";
import {
  Users, Search, Shield, UserX, UserCheck, Calendar, Mail,
  Trash2, Edit2, RefreshCw, ChevronDown, ChevronUp, Eye, EyeOff, Loader2
} from "lucide-react";

type UserRole = "user" | "admin";

interface UserRecord {
  email: string;
  passwordHash: string;
  name: string;
  createdAt: number;
  role?: UserRole;
  lastLogin?: number;
}

interface UserWithMeta extends UserType {
  role: UserRole;
  passwordHash: string;
}

export function AdminPanel() {
  const [users, setUsers] = useState<UserWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("user");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, admins: 0, todayRegistrations: 0 });

  const loadUsers = async () => {
    setLoading(true);
    const rawUsers = getUsers();
    const mapped: UserWithMeta[] = rawUsers.map(u => ({
      id: crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
      email: u.email,
      name: u.name,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin || u.createdAt,
      role: (u as any).role || "user",
      passwordHash: u.passwordHash,
    }));
    setUsers(mapped);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRegs = mapped.filter(u => u.createdAt >= today.getTime()).length;
    
    setStats({
      total: mapped.length,
      admins: mapped.filter(u => u.role === "admin").length,
      todayRegistrations: todayRegs,
    });
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (email: string) => {
    if (!window.confirm(`确定要删除用户 ${email} 吗？此操作不可撤销。`)) return;
    
    const rawUsers = getUsers();
    const updated = rawUsers.filter(u => u.email !== email);
    try {
      localStorage.setItem("compliance_cat_users", JSON.stringify(updated));
      await loadUsers();
      setDeleteConfirm(null);
    } catch (e) {
      console.error("Failed to delete user:", e);
      alert("删除用户失败");
    }
  };

  const handleUpdate = async (email: string) => {
    const rawUsers = getUsers();
    const idx = rawUsers.findIndex(u => u.email === email);
    if (idx === -1) return;

    rawUsers[idx].name = editName;
    (rawUsers[idx] as any).role = editRole;

    try {
      localStorage.setItem("compliance_cat_users", JSON.stringify(rawUsers));
      await loadUsers();
      setEditingUser(null);
    } catch (e) {
      console.error("Failed to update user:", e);
      alert("更新用户失败");
    }
  };

  const togglePassword = (email: string) => {
    setShowPassword(prev => ({ ...prev, [email]: !prev[email] }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-400" />
            用户管理面板
          </h1>
          <p className="text-slate-400 text-sm mt-1">管理注册用户、角色和权限</p>
        </div>
        <button
          onClick={loadUsers}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition"
        >
          <RefreshCw className="h-4 w-4" />
          刷新
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">总用户数</div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Shield className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">管理员</div>
              <div className="text-2xl font-bold text-white">{stats.admins}</div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Calendar className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <div className="text-sm text-slate-400">今日注册</div>
              <div className="text-2xl font-bold text-white">{stats.todayRegistrations}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="搜索用户姓名或邮箱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 transition"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto" />
            <p className="text-slate-400 mt-2">加载中...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>没有找到匹配的用户</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">用户</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">邮箱</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">角色</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">注册时间</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">最后登录</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => (
                  <tr key={user.email} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-400">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        {editingUser === user.email ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm w-32"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium text-white">{user.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-sm text-slate-300">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingUser === user.email ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm"
                        >
                          <option value="user">普通用户</option>
                          <option value="admin">管理员</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {user.role === "admin" ? "管理员" : "普通用户"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {new Date(user.lastLogin).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingUser === user.email ? (
                          <>
                            <button
                              onClick={() => handleUpdate(user.email)}
                              className="p-1.5 rounded-lg bg-green-600 hover:bg-green-700 transition"
                              title="保存"
                            >
                              <UserCheck className="h-3.5 w-3.5 text-white" />
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="p-1.5 rounded-lg bg-slate-600 hover:bg-slate-700 transition"
                              title="取消"
                            >
                              <UserX className="h-3.5 w-3.5 text-white" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingUser(user.email);
                                setEditName(user.name);
                                setEditRole(user.role);
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/10 transition"
                              title="编辑"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-slate-400 hover:text-white" />
                            </button>
                            <button
                              onClick={() => togglePassword(user.email)}
                              className="p-1.5 rounded-lg hover:bg-white/10 transition"
                              title={showPassword[user.email] ? "隐藏密码" : "显示密码"}
                            >
                              {showPassword[user.email] ? (
                                <EyeOff className="h-3.5 w-3.5 text-slate-400 hover:text-white" />
                              ) : (
                                <Eye className="h-3.5 w-3.5 text-slate-400 hover:text-white" />
                              )}
                            </button>
                            {deleteConfirm === user.email ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(user.email)}
                                  className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 transition"
                                  title="确认删除"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-white" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="p-1.5 rounded-lg bg-slate-600 hover:bg-slate-700 transition"
                                  title="取消"
                                >
                                  <UserX className="h-3.5 w-3.5 text-white" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(user.email)}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 transition"
                                title="删除"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-400" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
