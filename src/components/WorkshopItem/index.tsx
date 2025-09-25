"use client";

export default function WorkshopItem({
  name,
  selected,
  onClick,
}: {
  name: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left pl-6 pr-3 py-2.5 rounded-[4px] transition-colors",
        selected
          ? "bg-[#0040B8]/10 text-[#0040B8]"
          : "text-gray-700 hover:bg-gray-50"
      ].join(" ")}
    >
      <span className="text-sm truncate">{name}</span>
    </button>
  );
}
