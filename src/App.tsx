import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";
import type { User } from "@supabase/supabase-js";
import Footer from "./components/Footer";

type EventData = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
};

// Type สำหรับประวัติกิจกรรม (Join table)
type HistoryData = {
  id: string;
  created_at: string;
  events: {
    name: string;
    start_time: string;
  };
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState<EventData | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [timeStatus, setTimeStatus] = useState<"early" | "open" | "closed">(
    "closed",
  );
  const [history, setHistory] = useState<HistoryData[]>([]);

  const checkTime = useCallback((event: EventData) => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    if (now < startTime) setTimeStatus("early");
    else if (now >= startTime && now <= endTime) setTimeStatus("open");
    else setTimeStatus("closed");
  }, []);

  // 1. โหลดกิจกรรมที่กำลัง active
  const fetchActiveEvent = useCallback(async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("is_active", true)
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setActiveEvent(data);
      checkTime(data);
    }
  }, [checkTime]);

  // 2. โหลดประวัติการเข้าร่วมกิจกรรมทั้งหมดของ User นี้
  const fetchUserHistory = useCallback(async (email: string) => {
    const { data } = await supabase
      .from("attendance")
      .select(
        `
        id,
        created_at,
        events (
          name,
          start_time
        )
      `,
      )
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (data) {
      setHistory(data as unknown as HistoryData[]);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      await fetchActiveEvent();
      if (session?.user) {
        await fetchUserHistory(session.user.email!);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setHasCheckedIn(false);
        setHistory([]);
      } else {
        fetchUserHistory(session.user.email!);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchActiveEvent, fetchUserHistory]);

  useEffect(() => {
    let isMounted = true;
    const checkAttendance = async () => {
      if (!user || !activeEvent) return;
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("email", user.email)
        .eq("event_id", activeEvent.id)
        .maybeSingle();

      if (isMounted && data) setHasCheckedIn(true);
    };
    checkAttendance();
    return () => {
      isMounted = false;
    };
  }, [user, activeEvent]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) alert(error.message);
  };

  const handleCheckIn = async () => {
    if (!user || !activeEvent || timeStatus !== "open") return;
    const studentId = user.email?.split("@")[0];

    const { error } = await supabase.from("attendance").insert([
      {
        user_id: user.id,
        email: user.email,
        student_id: studentId,
        event_id: activeEvent.id,
      },
    ]);

    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } else {
      setHasCheckedIn(true);
      fetchUserHistory(user.email!);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setHasCheckedIn(false);
  };

  // ปรับหน้า Loading ให้เป็นโทนสว่าง
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen w-full bg-white relative font-sans flex flex-col text-neutral-800 overflow-x-hidden">
      {/* Sunny Glow Background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at center, #fde047, transparent)`,
        }}
      />

      {/* --- Navbar --- */}
      {user && (
        <nav className="z-10 w-full border-b border-neutral-200 bg-white/60 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center font-bold text-neutral-900 shadow-lg shadow-yellow-400/20">
              SC
            </div>
            <h1 className="font-bold text-lg tracking-wide bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-transparent">
              SCITECH Attendance
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-neutral-900">
                {user.user_metadata?.full_name || user.email}
              </p>
              <p className="text-xs text-neutral-500">{user.email}</p>
            </div>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full border border-neutral-200 shadow-md"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-neutral-200 border border-neutral-300"></div>
            )}
            <button
              onClick={handleLogout}
              className="ml-2 text-sm bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </nav>
      )}

      {/* --- Main Content --- */}
      <main className="relative z-10 w-full max-w-4xl mx-auto p-6 space-y-8 pt-10 flex-1">
        {!user ? (
          /* --- Login Card --- */
          <div className="max-w-md mx-auto mt-20 bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-neutral-100">
            <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center font-bold text-3xl text-neutral-900 shadow-lg shadow-yellow-400/30 mx-auto mb-6">
              SC
            </div>
            <h1 className="text-2xl font-bold text-center mb-2 text-neutral-900">
              SCITECH Attendance
            </h1>
            <p className="text-neutral-500 text-center mb-8 text-sm">
              ระบบเช็คชื่อเข้าร่วมกิจกรรมคณะวิทยาศาสตร์และเทคโนโลยี
              <br />
              มหาวิทยาลัยเทคโนโลยีราชมงคลตะวันออก
            </p>
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 font-semibold py-3 px-4 rounded-xl transition-all flex justify-center items-center gap-3 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-5 h-5"
                alt="Google"
              />
              Sign in with @rmutto.ac.th
            </button>
          </div>
        ) : (
          /* --- Dashboard Grid --- */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Check-in Box */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-neutral-100 relative overflow-hidden">
                <h2 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider mb-2">
                  Current Event
                </h2>
                <h1 className="text-3xl font-bold mb-8 text-neutral-900">
                  {activeEvent ? activeEvent.name : "ขณะนี้ไม่มีกิจกรรม"}
                </h1>

                <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100 flex flex-col items-center justify-center min-h-[200px] text-center">
                  {!activeEvent ? (
                    <p className="text-neutral-500">
                      ยังไม่มีกิจกรรมที่เปิดให้เช็คชื่อในระบบ
                    </p>
                  ) : hasCheckedIn ? (
                    <div className="animate-in fade-in zoom-in duration-300">
                      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                      </div>
                      <h2 className="text-xl font-semibold text-green-600 mb-2">
                        เช็คชื่อสำเร็จแล้ว
                      </h2>
                      <p className="text-neutral-500 text-sm">
                        ระบบบันทึกเวลาเข้าร่วมกิจกรรมของคุณเรียบร้อยแล้ว
                      </p>
                    </div>
                  ) : timeStatus === "early" ? (
                    <>
                      <h2 className="text-xl font-semibold text-amber-500 mb-2">
                        ยังไม่เปิดรับเช็คชื่อ
                      </h2>
                      <p className="text-neutral-500 text-sm mb-6">
                        เปิดให้เช็คชื่อในวันที่{" "}
                        {new Date(activeEvent.start_time).toLocaleString(
                          "th-TH",
                        )}
                      </p>
                      <button
                        disabled
                        className="bg-neutral-200 text-neutral-400 font-bold py-3 px-8 rounded-xl cursor-not-allowed w-full max-w-xs"
                      >
                        รอยืนยันการเข้าร่วม
                      </button>
                    </>
                  ) : timeStatus === "closed" ? (
                    <>
                      <h2 className="text-xl font-semibold text-red-500 mb-2">
                        หมดเวลาเช็คชื่อแล้ว
                      </h2>
                      <p className="text-neutral-500 text-sm mb-6">
                        ปิดรับเช็คชื่อไปเมื่อ{" "}
                        {new Date(activeEvent.end_time).toLocaleString("th-TH")}
                      </p>
                      <button
                        disabled
                        className="bg-neutral-200 text-neutral-400 font-bold py-3 px-8 rounded-xl cursor-not-allowed w-full max-w-xs"
                      >
                        หมดเวลาเข้าร่วม
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-neutral-500 text-sm mb-6">
                        กรุณากดปุ่มด้านล่างเพื่อบันทึกเวลาเข้าร่วมกิจกรรม
                      </p>
                      <button
                        onClick={handleCheckIn}
                        className="bg-yellow-400 hover:bg-yellow-500 text-neutral-900 font-bold py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:shadow-[0_0_30px_rgba(250,204,21,0.6)] transition-all active:scale-95 text-lg w-full max-w-xs border border-yellow-300 cursor-pointer"
                      >
                        ยืนยันการเข้าร่วม
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Activity History */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-neutral-100 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <svg
                    className="w-5 h-5 text-yellow-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <h2 className="text-lg font-bold text-neutral-900">
                    ประวัติการเข้าร่วม
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {history.length === 0 ? (
                    <div className="text-center py-10 text-neutral-400 text-sm border border-dashed border-neutral-200 rounded-xl">
                      ยังไม่มีประวัติการเช็คชื่อ
                    </div>
                  ) : (
                    history.map((item) => (
                      <div
                        key={item.id}
                        className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 hover:border-yellow-200 transition-colors"
                      >
                        <p className="text-xs text-neutral-500 mb-1">
                          {new Date(item.created_at).toLocaleDateString(
                            "th-TH",
                            { year: "numeric", month: "short", day: "numeric" },
                          )}
                          {" • "}
                          {new Date(item.created_at).toLocaleTimeString(
                            "th-TH",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </p>
                        <p className="text-sm font-medium text-neutral-800 line-clamp-2">
                          {item.events?.name || "Unknown Event"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- Footer Component --- */}
      <Footer />
    </div>
  );
}

export default App;
