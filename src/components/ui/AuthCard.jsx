export default function AuthCard({ title, children }) {
  return (
    <div className="w-full max-w-md mx-auto mt-20 p-8 bg-gray-900 rounded-xl shadow-xl 
    animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-6 text-center">{title}</h1>
      {children}
    </div>
  );
}
