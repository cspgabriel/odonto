"use client";

import { motion } from "framer-motion";
import { Mail, ArrowRight, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { OPHTHALMOLOGY_MAX_WIDTH } from "./config";

export function AppointmentUpdates() {
  return (
    <section className="relative py-12 bg-[#2D2D5F] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,_rgba(225,29,72,0.1)_0%,_transparent_50%)]"></div>
      
      <div className={cn("mx-auto px-4 relative z-10", OPHTHALMOLOGY_MAX_WIDTH)}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-500 shrink-0">
                <Bell className="w-8 h-8 animate-ring" />
             </div>
             <div>
                <h3 className="text-2xl font-black text-white mb-1">Important Updates Waiting for you</h3>
                <p className="text-white/60 font-medium">Get our latest and best contents right into your inbox</p>
             </div>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl items-stretch">
            <div className="flex-1 relative">
               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
               <input 
                 type="email" 
                 placeholder="Your Email Address" 
                 className="w-full h-14 bg-white/10 border border-white/20 rounded-2xl pl-12 pr-4 text-white outline-none focus:border-teal-500 transition-all font-medium placeholder:text-slate-400"
               />
            </div>
            <button className="h-14 px-8 rounded-full bg-teal-500 text-white font-black hover:bg-teal-600 transition-all flex items-center justify-center gap-2 whitespace-nowrap active:scale-95">
               Subscribe Now
               <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
