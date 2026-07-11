export type NotificationType = "info" | "success" | "warning" | "error";
export type NotificationCategory =
  | "academic"
  | "attendance"
  | "grade"
  | "schedule"
  | "registration"
  | "system"
  | "message";

export interface Notification {
  id: string;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  type: 'registration' | 'grade' | 'exam' | 'attendance' | 'warning';
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
}
