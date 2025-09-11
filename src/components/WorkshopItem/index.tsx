
export default function TallerItem({
    name,
    selected,
    onClick
  }: {
    name: string;
    selected?: boolean;
    onClick: () => void;
  }) {
    return (
      <div
        onClick={onClick}
        className={`flex items-center gap-3 text-sm max-[1500px]:text-xs text-[#000000] cursor-pointer 
          ${selected ? "font-semibold text-[#0040B8]" : "hover:text-[#0040B8]"}`}
      >
        <div className={`w-2 h-2  ${selected ? "bg-[#0040B8]" : "bg-gray-400"} rounded-full`} />
        <span className="truncate max-w-[100px] sm:max-w-[140px] md:max-w-[180px] block">{name}</span>
      </div>
    );
  }
  