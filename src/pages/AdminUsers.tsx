import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, UserPlus, Search, Filter, 
  MoreVertical, Calendar, CheckCircle
} from "lucide-react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import { useAuth } from "@/src/lib/auth";
import { formatDate } from "@/src/lib/utils";
import type { User, UserRole } from "@/src/types";
import { motion } from "motion/react";
import AdminSidebar from "@/src/components/layout/AdminSidebar";

export default function AdminUsers() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate("/login");
    }
  }, [currentUser, authLoading, navigate]);

  useEffect(() => {
    if (authLoading || !currentUser || currentUser.role !== 'admin') return;

    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error in users snapshot:", error);
      if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, "users");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, authLoading]);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    if (currentUser?.role !== 'admin') {
      alert("तपाईंसँग यो अनुमति छैन।");
      return;
    }
    
    try {
      await updateDoc(doc(db, "users", uid), { 
        role: newRole,
        // If approving a request, clear it
        "roleRequest.status": "approved"
      });
    } catch (err) {
      console.error("Error updating role:", err);
    }
  };

  const handleRejectRequest = async (uid: string) => {
    try {
      await updateDoc(doc(db, "users", uid), {
        "roleRequest.status": "rejected"
      });
    } catch (err) {
      console.error("Error rejecting request:", err);
    }
  };

  const roleRequests = users.filter(u => u.roleRequest?.status === 'pending');

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center">लोड हुँदैछ...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content */}
      <motion.main 
        initial={false}
        animate={{ marginLeft: isCollapsed ? "80px" : "280px" }}
        className="flex-grow p-8 transition-all duration-300 ease-in-out"
      >
        <header className="flex items-center justify-between mb-12">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">प्रयोगकर्ता व्यवस्थापन</h1>
            <p className="text-sm font-medium text-slate-500">तपाईंको टिम र स्टाफहरूको विवरण यहाँ छ।</p>
          </div>
          
          <button className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            <UserPlus size={20} /> नयाँ प्रयोगकर्ता थप्नुहोस्
          </button>
        </header>

        {/* Filters & Search */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="नाम वा इमेल खोज्नुहोस्..." 
              className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
              <Filter size={18} /> फिल्टर
            </button>
          </div>
        </div>

        {/* Role Requests Section */}
        {roleRequests.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-3">
              <CheckCircle className="text-primary" /> भूमिका परिवर्तन अनुरोधहरू
              <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">{roleRequests.length}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roleRequests.map((u) => (
                <div key={u.uid} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center text-slate-400 font-bold border-2 border-white shadow-sm">
                      {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" /> : u.displayName?.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{u.displayName}</span>
                      <span className="text-xs text-slate-400">{u.email}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-600">अनुरोध गरिएको भूमिका: <span className="text-primary uppercase">{u.roleRequest?.requestedRole}</span></p>
                    <p className="text-[10px] text-slate-400 mt-1">{formatDate(u.roleRequest?.requestedAt)}</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleRoleChange(u.uid, u.roleRequest!.requestedRole)}
                      className="flex-grow bg-primary text-white py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all"
                    >
                      स्वीकार गर्नुहोस्
                    </button>
                    <button 
                      onClick={() => handleRejectRequest(u.uid)}
                      className="flex-grow bg-slate-100 text-slate-600 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                    >
                      अस्वीकार गर्नुहोस्
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">प्रयोगकर्ता</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">भूमिका (Role)</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">अवस्था (Status)</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">दर्ता मिति</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center text-slate-400 font-bold border-2 border-white shadow-sm">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          u.displayName?.charAt(0) || "U"
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{u.displayName}</span>
                        <span className="text-xs text-slate-400">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <select 
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                      disabled={currentUser?.role !== 'admin' || u.uid === currentUser.uid}
                      className="bg-slate-100 border-none rounded-xl py-2 px-4 text-xs font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="user">Reporter</option>
                    </select>
                  </td>
                  <td className="px-8 py-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                      <CheckCircle size={12} /> सक्रिय
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Calendar size={14} className="text-slate-300" />
                      {formatDate(u.createdAt)}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-slate-300 hover:text-primary transition-all">
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.main>
    </div>
  );
}
