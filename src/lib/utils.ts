import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: any) {
  if (!date) return "भर्खरै";

  let d: Date;
  if (date && typeof date.toDate === 'function') {
    d = date.toDate();
  } else {
    d = new Date(date);
  }

  if (isNaN(d.getTime())) return "भर्खरै";

  return new Intl.DateTimeFormat("ne-NP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(d);
}

export function getCategoryColor(categoryId: string) {
  const colors: Record<string, string> = {
    politics: "bg-blue-600",
    desh: "bg-red-600",
    pradesh: "bg-green-600",
    bishwo: "bg-indigo-600",
    sports: "bg-orange-600",
    entertainment: "bg-pink-600",
    economy: "bg-emerald-600",
    tech: "bg-slate-800",
    health: "bg-cyan-600",
    education: "bg-amber-600",
    opinion: "bg-violet-600",
    interview: "bg-rose-600",
    literature: "bg-yellow-600",
    video: "bg-red-700",
  };
  return colors[categoryId] || "bg-primary";
}
