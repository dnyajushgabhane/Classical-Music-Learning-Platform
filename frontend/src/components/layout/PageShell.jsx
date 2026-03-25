export default function PageShell({ children, className = '' }) {
  return (
    <div className={`max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 lg:py-14 ${className}`}>
      {children}
    </div>
  );
}
