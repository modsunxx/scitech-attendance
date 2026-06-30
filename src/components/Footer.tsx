// src/components/Footer.tsx

export default function Footer() {
  return (
    <footer className="relative z-10 w-full border-t border-neutral-200/50 bg-white/50 backdrop-blur-md py-6 mt-auto">
      <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></div>
            <h3 className="text-sm font-bold text-neutral-700">
              SCITECH Student Club
            </h3>
          </div>
          <p className="text-xs text-neutral-500">
            Faculty of Science and Technology, RMUTTO
          </p>
        </div>
        <div className="text-xs text-neutral-400 text-center md:text-right">
          <p>&copy; {new Date().getFullYear()} Attendance System</p>
          <p className="mt-1 opacity-70">Powered by React & Supabase</p>
        </div>
      </div>
    </footer>
  );
}
