// components/layout/Shell.jsx
import Sidebar from './Sidebar';

export default function Shell({ children }) {
  return (
    <div className="flex h-screen bg-black text-white font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}