"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from "@/lib/utils";

interface ImageComparisonSliderProps {
    beforeImage: string;
    afterImage: string;
    altBefore?: string;
    altAfter?: string;
    className?: string;
    /** 'rose' (dental), 'indigo', or 'primary' (general theme) for label/handle colors */
    variant?: "rose" | "indigo" | "primary";
}

const variantClasses: Record<"rose" | "indigo" | "primary", { handle: string; labelAfter: string }> = {
  rose: {
    handle: "text-rose-500",
    labelAfter: "bg-rose-500/80",
  },
  indigo: {
    handle: "text-indigo-600",
    labelAfter: "bg-indigo-600/80",
  },
  primary: {
    handle: "text-primary",
    labelAfter: "bg-primary/80",
  },
};

export const ImageComparisonSlider = ({ 
    beforeImage, 
    afterImage, 
    altBefore = 'Before', 
    altAfter = 'After',
    className,
    variant = "rose",
}: ImageComparisonSliderProps) => {
    const v = variantClasses[variant] ?? variantClasses.rose;
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = useCallback((clientX: number) => {
        if (!isDragging || !containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        let newPosition = ((clientX - rect.left) / rect.width) * 100;

        newPosition = Math.max(0, Math.min(100, newPosition));
        setSliderPosition(newPosition);
    }, [isDragging]);

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = useCallback(() => setIsDragging(false), []);
    const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
    
    const handleTouchStart = () => setIsDragging(true);
    const handleTouchEnd = () => setIsDragging(false);
    const handleTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);

    useEffect(() => {
        const onMouseUp = () => handleMouseUp();
        window.addEventListener('mouseup', onMouseUp);
        return () => window.removeEventListener('mouseup', onMouseUp);
    }, [handleMouseUp]);

    return (
        <div 
            ref={containerRef}
            className={cn("relative w-full aspect-[16/8] select-none overflow-hidden", className)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* After Image (Bottom Layer) */}
            <img
                src={afterImage}
                alt={altAfter}
                className="absolute inset-0 block h-full w-full object-cover object-left"
                draggable="false"
            />

            {/* Before Image (Top Layer) - Visibility controlled by clip-path */}
            <div
                className="absolute inset-0 h-full w-full overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <img
                    src={beforeImage}
                    alt={altBefore}
                    className="absolute inset-0 block h-full w-full object-cover object-left"
                    draggable="false"
                />
            </div>

            {/* Slider Handle */}
            <div
                className="absolute top-0 bottom-0 w-1 z-30 cursor-ew-resize flex items-center justify-center"
                style={{ left: `calc(${sliderPosition}% - 0.5px)` }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                {/* Vertical Line */}
                <div className="absolute top-0 bottom-0 w-1 bg-white/90 shadow-sm" />
                
                {/* Pill Handle Container */}
                <div className={cn(
                    "relative z-40 bg-white rounded-2xl h-20 w-12 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-50 transition-all duration-200 ease-in-out",
                    v.handle,
                    isDragging ? 'scale-110 h-[88px] w-14' : 'scale-100'
                )}>
                    {/* The specific parallel lines icon shared by the user */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                        <line x1="15" y1="18" x2="9" y2="12"></line>
                        <line x1="9" y1="6" x2="15" y2="12"></line>
                    </svg>
                </div>
            </div>

            {/* Labels */}
            <div className="absolute left-8 bottom-8 z-20 pointer-events-none">
                <span className="px-4 py-2 rounded-xl bg-slate-900/60 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest">Initial Case</span>
            </div>
            <div className="absolute right-8 bottom-8 z-20 pointer-events-none">
                <span className={cn("px-4 py-2 rounded-xl backdrop-blur-md text-white text-xs font-black uppercase tracking-widest", v.labelAfter)}>Final Result</span>
            </div>
        </div>
    );
};
