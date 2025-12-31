'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CircleFadingPlus,
  ClipboardList,
  ChevronRight,
  RefreshCw,
  Clock
} from 'lucide-react';

import Card from '../Card';
import { handleCreateApplication } from '@/utils';

type QuickActionsProps = {
  workshopId: number;
  availableInspections?: number | null;
};

export default function QuickActions({ workshopId, availableInspections }: QuickActionsProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const available = typeof availableInspections === 'number' ? availableInspections : null;

  const isNewDisabled = creating || available === 0;

  const handleNewClick = () => {
    if (isNewDisabled) return;
    void handleCreateApplication(available, String(workshopId), setCreating, router);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <button
        type="button"
        onClick={handleNewClick}
        disabled={isNewDisabled}
        className="group w-full text-left disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Card className="h-full transition-colors duration-200 group-hover:bg-[#f1f6ff99] group-hover:border-[#0040B899] group-focus:ring-2 group-focus:ring-offset-2 group-focus:ring-[#0040B8]">
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-[50px] bg-[#E6ECF8] text-[#0040B8] flex items-center justify-center hidden sm:flex">
                <CircleFadingPlus className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-md ml-0 sm:ml-2">Nueva revisión</h4>
              </div>
            </div>
            {creating ? (
              <RefreshCw className="h-5 w-5 text-[#0040B8] animate-spin" />
            ) : (
              <ChevronRight className="h-5 w-5 group-hover:text-[#0040B8] transition-colors duration-200" />
            )}
          </div>
        </Card>
      </button>

      <Link href={`/dashboard/${workshopId}/applications/continue-application`} className="group">
        <Card className="h-full transition-colors duration-200 group-hover:bg-[#f1f6ff99] group-hover:border-[#0040B899] group-focus:ring-2 group-focus:ring-offset-2 group-focus:ring-[#0040B8]">
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-[50px] bg-[#E6ECF8] text-[#0040B8] flex items-center justify-center hidden sm:flex">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-md ml-0 sm:ml-2">Continuar revisión</h4>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 group-hover:text-[#0040B8] transition-colors duration-200" />
          </div>
        </Card>
      </Link>

      <Link href={`/dashboard/${workshopId}/inspections-queue`} className="group">
        <Card className="h-full transition-colors duration-200 group-hover:bg-[#f1f6ff99] group-hover:border-[#0040B899] group-focus:ring-2 group-focus:ring-offset-2 group-focus:ring-[#0040B8]">
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-[50px] bg-[#E6ECF8] text-[#0040B8] flex items-center justify-center hidden sm:flex">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-md ml-0 sm:ml-2">Cola de revisiones</h4>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 group-hover:text-[#0040B8] transition-colors duration-200" />
          </div>
        </Card>
      </Link>
    </div>
  );
}

