import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import type { User } from "@supabase/supabase-js";

// สร้าง Type สำหรับข้อมูลกิจกรรม
type EventData = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState<EventData | null>(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [timeStatus, setTimeStatus] = useState<"early" | "open" | "closed">(
    "closed",
  );

  // ฟังก์ชันโหลดกิจกรรมที่กำลัง active
  const fetchActiveEvent = async () => {
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
  };

  // ฟังก์ชันเช็คว่าตอนนี้อยู่ในช่วงเวลาที่ให้เช็คชื่อไหม
  const checkTime = (event: EventData) => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    if (now < startTime) {
      setTimeStatus("early");
    } else if (now >= startTime && now <= endTime) {
      setTimeStatus("open");
    } else {
      setTimeStatus("closed");
    }
  };

  useEffect(() => {
    // โหลดข้อมูล User และ กิจกรรม พร้อมกันตอนเปิดแอป
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      await fetchActiveEvent();
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setHasCheckedIn(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // เช็คว่าเช็คชื่อไปหรือยัง ทุกครั้งที่เปลี่ยน user หรือ เปลี่ยนกิจกรรม
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

      if (isMounted && data) {
        setHasCheckedIn(true);
      }
    };

    checkAttendance();

    return () => {
      isMounted = false;
    };
  }, [user, activeEvent]);

  // ฟังก์ชันล็อกอินผ่าน Google OAuth
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) alert(error.message);
  };

  // ฟังก์ชันกดบันทึกเช็คชื่อ
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
      alert("เช็คชื่อเข้าร่วมกิจกรรมสำเร็จเรียบร้อยครับ!");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setHasCheckedIn(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <p className="text-neutral-400 animate-pulse">กำลังโหลดระบบ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4">
      {!user ? (
        /* --- Login View --- */
        <div className="w-full max-w-md bg-neutral-800 p-8 rounded-2xl shadow-xl border border-neutral-700">
          <h1 className="text-2xl font-bold text-center mb-2">เข้าสู่ระบบ</h1>
          <p className="text-neutral-400 text-center mb-8 text-sm">
            ระบบเช็คชื่อเข้าร่วมกิจกรรมคณะวิทยาศาสตร์และเทคโนโลยี
            <br />
            มหาวิทยาลัยเทคโนโลยีราชมงคลตะวันออก
          </p>

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 cursor-pointer shadow-md"
            >
              Sign in with Google (@rmutto.ac.th)
            </button>
          </div>
        </div>
      ) : (
        /* --- Dashboard / Attendance View --- */
        <div className="w-full max-w-2xl bg-neutral-800 p-8 rounded-2xl shadow-xl border border-neutral-700">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-neutral-700">
            <div>
              <h1 className="text-2xl font-bold">
                {activeEvent ? activeEvent.name : "ไม่มีกิจกรรมที่เปิดอยู่"}
              </h1>
              <p className="text-neutral-400 text-sm">
                เข้าสู่ระบบโดย: {user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1 rounded-md transition-colors cursor-pointer"
            >
              ออกจากระบบ
            </button>
          </div>

          <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-700 text-center space-y-4">
            {!activeEvent ? (
              <>
                <h2 className="text-xl font-semibold text-neutral-400">
                  ขณะนี้ไม่มีกิจกรรม
                </h2>
                <p className="text-neutral-500 text-sm">
                  ยังไม่มีกิจกรรมที่เปิดให้เช็คชื่อในระบบ
                </p>
              </>
            ) : hasCheckedIn ? (
              <>
                <h2 className="text-xl font-semibold text-green-400">
                  สถานะ: เช็คชื่อสำเร็จแล้ว ✓
                </h2>
                <p className="text-neutral-400 text-sm">
                  ระบบได้บันทึกเวลาเข้าร่วมกิจกรรมของคุณเรียบร้อยแล้ว ขอบคุณครับ
                </p>
              </>
            ) : timeStatus === "early" ? (
              <>
                <h2 className="text-xl font-semibold text-amber-400">
                  ยังไม่ถึงเวลาเปิดรับเช็คชื่อ
                </h2>
                <p className="text-neutral-400 text-sm">
                  ระบบจะเปิดให้เช็คชื่อในวันที่{" "}
                  {new Date(activeEvent.start_time).toLocaleString("th-TH")}
                </p>
                <button
                  disabled
                  className="bg-neutral-700 text-neutral-500 font-bold py-4 px-8 rounded-full cursor-not-allowed text-lg"
                >
                  ยืนยันการเข้าร่วมกิจกรรม
                </button>
              </>
            ) : timeStatus === "closed" ? (
              <>
                <h2 className="text-xl font-semibold text-red-500">
                  หมดเวลาเช็คชื่อแล้ว
                </h2>
                <p className="text-neutral-400 text-sm">
                  ระบบปิดรับการเช็คชื่อเมื่อ{" "}
                  {new Date(activeEvent.end_time).toLocaleString("th-TH")}
                </p>
                <button
                  disabled
                  className="bg-neutral-700 text-neutral-500 font-bold py-4 px-8 rounded-full cursor-not-allowed text-lg"
                >
                  ยืนยันการเข้าร่วมกิจกรรม
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-amber-400">
                  สถานะ: ยังไม่ได้เช็คชื่อ
                </h2>
                <p className="text-neutral-400 text-sm">
                  กรุณากดปุ่มด้านล่างเพื่อบันทึกเวลาเข้าร่วมกิจกรรมในฐานข้อมูล
                </p>
                <button
                  onClick={handleCheckIn}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-green-900/20 transition-transform active:scale-95 text-lg cursor-pointer"
                >
                  ยืนยันการเช็คชื่อเข้าร่วมกิจกรรม
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
