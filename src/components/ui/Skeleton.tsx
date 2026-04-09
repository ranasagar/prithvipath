import { motion } from "motion/react";

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={`relative overflow-hidden bg-slate-200 rounded-md ${className}`}>
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
      animate={{
        x: ["-100%", "100%"],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  </div>
);

export const ArticleSkeleton = () => (
  <div className="flex flex-col gap-4">
    <Skeleton className="aspect-video w-full rounded-3xl" />
    <div className="flex flex-col gap-2">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-6 w-1/2" />
      <div className="flex gap-4 mt-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </div>
);

export const CategoryBlockSkeleton = () => (
  <div className="flex flex-col gap-8 py-12 border-t border-slate-100 w-full">
    <div className="flex items-center justify-between">
      <Skeleton className="h-10 w-48 rounded-2xl" />
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <ArticleSkeleton />
      <ArticleSkeleton />
    </div>
  </div>
);
