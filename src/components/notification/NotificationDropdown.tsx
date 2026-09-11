"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Check, Calendar, AlertCircle } from "lucide-react";
import { Notification } from "@/types";
import {
  subscribeToUserNotifications,
  markNotificationAsRead,
} from "@/services/notificationService";
import { useAuth } from "@/hooks/useAuth";
import { formatISTDateTime } from "@/utils/date";

export const NotificationDropdown: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserNotifications(user.uid, (list) => {
      setNotifications(list);
    });
    return () => unsub();
  }, [user]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await markNotificationAsRead(id);
  };

  const getNotificationLink = (notif: Notification) => {
    if (!notif.consultationId) return "#";
    if (user?.role === "ADMIN") return `/admin/consultations/${notif.consultationId}`;
    if (user?.role === "FRANCHISE") return `/franchise/consultations/${notif.consultationId}`;
    if (user?.role === "DOCTOR") return `/doctor/upcoming`;
    return "#";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition focus:outline-none"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-2xl ring-1 ring-black/10 z-50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => {
                const isRescheduled = notif.type === "CONSULTATION_RESCHEDULED";
                return (
                  <Link
                    key={notif.notificationId}
                    href={getNotificationLink(notif)}
                    onClick={() => {
                      if (!notif.isRead) markNotificationAsRead(notif.notificationId);
                      setIsOpen(false);
                    }}
                    className={`block p-3.5 hover:bg-slate-50 transition ${
                      !notif.isRead
                        ? isRescheduled
                          ? "bg-purple-50/70"
                          : "bg-blue-50/50"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        {isRescheduled ? (
                          <div className="mt-0.5 rounded-md bg-purple-100 p-1.5 text-purple-700">
                            <Calendar className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="mt-0.5 rounded-md bg-blue-100 p-1.5 text-blue-700">
                            <AlertCircle className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <p
                            className={`text-xs ${
                              isRescheduled
                                ? "font-bold text-purple-950"
                                : "font-semibold text-slate-900"
                            }`}
                          >
                            {notif.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                            {notif.message}
                          </p>
                          <p className="mt-1.5 text-[10px] text-slate-400">
                            {formatISTDateTime(notif.createdAt)}
                          </p>
                        </div>
                      </div>

                      {!notif.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(e, notif.notificationId)}
                          title="Mark as read"
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
