import clsx from "clsx";

export default function Card({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
      <div className={clsx('rounded-[8px] border border-[#d3d3d3] bg-white', className)}>
        {children}
      </div>
    );
  }