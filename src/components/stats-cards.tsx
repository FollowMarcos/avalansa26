"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

interface StatsCardsProps {
  className?: string;
  width?: string;
  height?: string;
  images?: string[];
}

export function StatsCards({
  className,
  width = "w-70",
  height = "h-84",
  images = ["/images/models/1.png", "/images/models/2.png"],
}: StatsCardsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-6 sm:gap-4 md:gap-0 px-4 py-8",
        inter.className,
        className
      )}
    >
      {/* Card 1: Revenue */}
      <motion.div
        className={cn(
          `relative z-10 ${width} ${height} bg-card rounded-[16px] p-5 flex flex-col justify-between hover:z-50 border border-border/50`
        )}
        initial={{
          rotate: -3,
        }}
        whileHover={{
          rotate: 0,
          scale: 1.05,
          transition: { duration: 0.3, ease: "easeInOut" },
        }}
      >
        <div>
          <h2 className="text-primary text-5xl font-semibold tracking-tighter">
            $100k+
          </h2>
        </div>
        <div>
          <h4 className="text-primary/80 font-medium text-lg leading-tight tracking-tighter">
            Revenue driven
          </h4>
          <div className="w-full h-px bg-primary/20 my-2"></div>
          <p className="text-primary/60 text-sm leading-tight tracking-tight max-w-[90%]">
            From scroll-stopping campaigns that actually sell.
          </p>
        </div>
      </motion.div>

      {/* Card 2: Image Stats */}
      <motion.div
        className={cn(
          `relative z-20 ${width} ${height} rounded-[16px] overflow-hidden group hover:z-50 border border-border/50`
        )}
        initial={{
          rotate: 2,
          y: 1,
        }}
        whileHover={{
          rotate: 0,
          scale: 1.05,
          transition: { duration: 0.3, ease: "easeInOut" },
        }}
      >
        <Image src={images[0]} alt="Model" fill className="object-cover" />
        <div className="absolute top-5 left-5 bg-background/90 py-[4px] px-[8px] rounded-full text-xs font-semibold tracking-tighter text-foreground border border-border/50">
          900k Liked
        </div>
      </motion.div>

      {/* Card 3: Impressions */}
      <motion.div
        className={cn(
          `relative z-30 ${width} ${height} bg-primary rounded-[16px] p-5 flex flex-col justify-between flex-shrink-0 hover:z-50`
        )}
        initial={{
          rotate: 8,
        }}
        whileHover={{
          rotate: 0,
          scale: 1.02,
          transition: { duration: 0.3, ease: "easeInOut" },
        }}
      >
        <div>
          <h2 className="text-primary-foreground text-5xl font-semibold tracking-tighter">
            37M+
          </h2>
        </div>
        <div>
          <h4 className="text-primary-foreground/90 font-medium text-lg leading-tight tracking-tighter">
            Organic impressions
          </h4>
          <div className="w-full h-px bg-primary-foreground/20 my-2"></div>
          <p className="text-primary-foreground/70 text-sm leading-tight tracking-tight max-w-[90%]">
            Growth through content that sells, not just trends.
          </p>
        </div>
      </motion.div>

      {/* Card 4: Image Stats */}
      <motion.div
        className={cn(
          `relative z-40 ${width} ${height} rounded-[16px] overflow-hidden -ml-1 hover:z-50 border border-border/50`
        )}
        initial={{
          rotate: -4,
        }}
        whileHover={{
          rotate: 0,
          scale: 1.05,
          transition: { duration: 0.3, ease: "easeInOut" },
        }}
      >
        <Image src={images[1]} alt="Campaign" fill className="object-cover" />
        <div className="absolute bottom-5 right-5 bg-background/90 py-[4px] px-[8px] rounded-full text-xs font-semibold tracking-tighter text-foreground border border-border/50">
          1.5M Viewed
        </div>
      </motion.div>
    </div>
  );
}
