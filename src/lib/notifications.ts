import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface NotificationPayload {
  title: string;
  message: string;
  type: "alert" | "info" | "success" | "warning";
  role?: "all" | "admin" | "editor" | "user"; // Target role
  recipientId?: string; // Target specific user
  link?: string; // URL to navigate
  isRead?: boolean;
}

export const createNotification = async (payload: NotificationPayload) => {
  try {
    const notificationsRef = collection(db, "notifications");
    await addDoc(notificationsRef, {
      ...payload,
      isRead: false,
      createdAt: new Date().toISOString(),
      // Ensure link is explicitly included if provided
      link: payload.link || null
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};
