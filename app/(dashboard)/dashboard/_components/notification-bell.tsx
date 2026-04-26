"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Loader2, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  getNotifications, 
  getUnreadNotificationsCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification
} from "@/lib/actions/notification-actions";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string | Date;
};

export function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch count initially and block fetch
  useEffect(() => {
    getUnreadNotificationsCount().then(setUnreadCount).catch(console.error);

    // Optional: add a polling interval here if desired
    const interval = setInterval(() => {
      getUnreadNotificationsCount().then(setUnreadCount).catch(console.error);
    }, 60000); // 1 min

    return () => clearInterval(interval);
  }, []);

  // Fetch list only when opened
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getNotifications(20)
        .then((data) => {
          setNotifications(data as Notification[]);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
    }
    setIsOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllNotificationsAsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDelete = async (e: React.MouseEvent, id: string, isRead: boolean) => {
    e.stopPropagation();
    await deleteNotification(id);
    if (!isRead) {
       setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative cursor-pointer rounded-xl transition-colors duration-200 hover:bg-muted/50 w-8 h-8 justify-center p-2"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-background pointer-events-none" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0 border-l border-border bg-background">
        <SheetHeader className="px-6 py-4 border-b shrink-0 flex flex-row items-center justify-between bg-card text-card-foreground">
          <SheetTitle className="text-xl font-bold">Notifications</SheetTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-primary mt-0" onClick={handleMarkAllAsRead}>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Bell className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-base text-slate-700 dark:text-slate-300">All caught up!</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">When you get notifications, they'll show up here.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 p-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "relative group flex flex-col items-start gap-1 cursor-pointer p-4 rounded-2xl border transition-all hover:shadow-md outline-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
                    !notification.isRead ? "border-rose-200 dark:border-rose-900/50 shadow-[0_4px_12px_rgba(244,63,94,0.05)] dark:shadow-none" : ""
                  )}
                  onClick={() => handleNotificationClick(notification)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationClick(notification);
                    }
                  }}
                >
                  <Button 
                     variant="ghost" 
                     size="icon" 
                     className="absolute top-3 right-3 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                     onClick={(e) => handleDelete(e, notification.id, notification.isRead)}
                  >
                     <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="flex items-start justify-between w-full pr-8">
                    <span className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{notification.title}</span>
                    {!notification.isRead && (
                      <span className="absolute top-4 right-4 flex h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.5)] group-hover:hidden" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1 pr-4">
                    {notification.message}
                  </p>
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-3 uppercase tracking-wider">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
