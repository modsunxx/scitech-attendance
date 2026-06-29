import { useState } from "react";

function App() {
  // จำลอง State การ Login
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // จำลองว่าถ้าลงท้ายด้วย @rmutto.ac.th ให้ผ่าน (เดี๋ยวค่อยเอา Supabase มาแทน)
    if (email.endsWith("@rmutto.ac.th")) {
      setIsLoggedIn(true);
    } else {
      alert("กรุณาใช้อีเมล @rmutto.ac.th ในการเข้าสู่ระบบ");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4">
      {!isLoggedIn ? (
        /* --- Login View --- */
        <div className="w-full max-w-md bg-neutral-800 p-8 rounded-2xl shadow-xl border border-neutral-700">
          <h1 className="text-2xl font-bold text-center mb-2">เข้าสู่ระบบ</h1>
          <p className="text-neutral-400 text-center mb-8 text-sm">
            ระบบเช็คชื่อเข้าร่วมกิจกรรมคณะวิทยาศาสตร์และเทคโนโลยี
            มหาวิทยาลัยเทคโนโลยีราชมงคลตะวันออก
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">
                อีเมลมหาวิทยาลัย
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@rmutto.ac.th"
                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              Sign in with Google
            </button>
          </form>
        </div>
      ) : (
        /* --- Dashboard / Attendance View --- */
        <div className="w-full max-w-2xl bg-neutral-800 p-8 rounded-2xl shadow-xl border border-neutral-700">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-neutral-700">
            <div>
              <h1 className="text-2xl font-bold">SCITECH VOLUNTEER</h1>
              <p className="text-neutral-400 text-sm">
                เข้าสู่ระบบโดย: {email}
              </p>
            </div>
            <button
              onClick={() => setIsLoggedIn(false)}
              className="text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1 rounded-md transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>

          <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-700 text-center space-y-4">
            <h2 className="text-xl font-semibold">สถานะ: ยังไม่ได้เช็คชื่อ</h2>
            <p className="text-neutral-400 text-sm">
              กรุณากดปุ่มด้านล่างเพื่อบันทึกเวลาเข้าร่วมกิจกรรม
            </p>
            <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full shadow-lg shadow-green-900/20 transition-transform active:scale-95 text-lg">
              ยืนยันการเข้าร่วมกิจกรรม
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
