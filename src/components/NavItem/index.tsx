export default function NavItem({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-[#000000] hover:text-blue-600 cursor-pointer">
      <div className="text-[#0040B8]">{icon}</div>
      <span>{label}</span>
    </div>
  );
}