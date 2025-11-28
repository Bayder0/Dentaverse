"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, X, ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthKey } from "@/lib/date";

function MonthSelectorInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  
  const selectedMonths = searchParams.get("months")?.split(",").filter(Boolean) || [getMonthKey(new Date())];
  
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const toggleMonth = (monthKey: string) => {
    const newMonths = selectedMonths.includes(monthKey)
      ? selectedMonths.filter((m) => m !== monthKey)
      : [...selectedMonths, monthKey].sort().reverse();
    
    // If all months deselected, default to current month
    const finalMonths = newMonths.length === 0 ? [getMonthKey(new Date())] : newMonths;
    
    startTransition(() => {
      const params = new URLSearchParams();
      params.set("months", finalMonths.join(","));
      
      const newUrl = `?${params.toString()}`;
      
      // Use replace to update URL and force refresh
      router.replace(newUrl);
      router.refresh();
    });
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const isCurrentMonth = (year: number, month: number) => {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth() + 1;
  };

  const getMonthKeyForDate = (year: number, month: number) => {
    return `${year}-${String(month).padStart(2, "0")}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-2 rounded-lg border-2 border-cyan-300 bg-white px-4 py-2 text-sm font-semibold text-cyan-900 hover:bg-cyan-50 transition disabled:opacity-50 shadow-sm"
      >
        <Calendar className="w-4 h-4" />
        <span>
          {selectedMonths.length === 1
            ? formatMonth(selectedMonths[0])
            : `${selectedMonths.length} months selected`}
        </span>
        {selectedMonths.length > 1 && (
          <span className="ml-2 rounded-full bg-cyan-600 px-2 py-0.5 text-xs text-white">
            {selectedMonths.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 z-50 w-96 rounded-xl border-2 border-cyan-300 bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">Select Months</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-cyan-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-cyan-100">
                Click months to select. Select multiple for aggregated statistics.
              </p>
            </div>
            
            <div className="p-4 max-h-[500px] overflow-y-auto">
              {years.map((year) => (
                <div key={year} className="mb-6 last:mb-0">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-cyan-900 text-base">{year}</h4>
                    {year === currentYear && (
                      <span className="text-xs text-cyan-600 bg-cyan-50 px-2 py-1 rounded">Current Year</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {monthNames.map((monthName, index) => {
                      const month = index + 1;
                      const monthKey = getMonthKeyForDate(year, month);
                      const isSelected = selectedMonths.includes(monthKey);
                      const isCurrent = isCurrentMonth(year, month);
                      
                      return (
                        <button
                          key={monthKey}
                          onClick={() => toggleMonth(monthKey)}
                          className={`
                            relative px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                            ${isSelected
                              ? "bg-cyan-600 text-white shadow-md scale-105"
                              : isCurrent
                              ? "bg-cyan-50 text-cyan-900 border-2 border-cyan-300 hover:bg-cyan-100"
                              : "bg-slate-50 text-slate-700 hover:bg-cyan-50 hover:text-cyan-900 border border-slate-200"
                            }
                          `}
                        >
                          {monthName}
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                              <span className="w-2 h-2 bg-cyan-600 rounded-full"></span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-cyan-200 bg-cyan-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-cyan-700 font-medium">
                  {selectedMonths.length} month{selectedMonths.length !== 1 ? "s" : ""} selected
                </span>
                {selectedMonths.length > 0 && (
                  <button
                    onClick={() => {
                      startTransition(() => {
                        const params = new URLSearchParams();
                        params.set("months", getMonthKey(new Date()));
                        router.push(`?${params.toString()}`);
                        router.refresh();
                      });
                    }}
                    className="text-xs text-cyan-600 hover:text-cyan-800 transition"
                  >
                    Reset
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  startTransition(() => {
                    router.refresh();
                  });
                }}
                className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2.5 px-4 text-sm transition shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function MonthSelector() {
  return (
    <Suspense fallback={<div className="h-10 w-48 bg-slate-100 rounded-lg animate-pulse" />}>
      <MonthSelectorInner />
    </Suspense>
  );
}
