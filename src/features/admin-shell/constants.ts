import {
  AlertCircle,
  Bell,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Grid,
  History,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  ScrollText,
  Settings,
  Share2,
  ShieldAlert,
  UserCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export type AdminNavSection = {
  title?: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Users",
    items: [
      {
        label: "Candidates",
        href: "/admin/users/candidates",
        icon: UserRound,
      },
      {
        label: "Employers",
        href: "/admin/users/employers",
        icon: Building2,
      },
    ],
  },
  {
    title: "Subscriptions",
    items: [
      {
        label: "Candidate Plans",
        href: "/admin/subscriptions/candidate-plans",
        icon: FileText,
      },
      {
        label: "Employer Plans",
        href: "/admin/subscriptions/employer-plans",
        icon: Building2,
      },
      {
        label: "Active Subscriptions",
        href: "/admin/subscriptions/active",
        icon: CheckCircle2,
      },
      {
        label: "Expiring Soon",
        href: "/admin/subscriptions/expiring",
        icon: Clock,
      },
      {
        label: "Subscription History",
        href: "/admin/subscriptions/history",
        icon: History,
      },
    ],
  },
  {
    title: "Payments",
    items: [
      {
        label: "Payment Requests",
        href: "/admin/payments/requests",
        icon: Inbox,
      },
      {
        label: "Paid Payments",
        href: "/admin/payments/paid",
        icon: CheckCircle2,
      },
      {
        label: "Pending Payments",
        href: "/admin/payments/pending",
        icon: Clock,
      },
      {
        label: "Payment History",
        href: "/admin/payments/history",
        icon: History,
      },
    ],
  },
  {
    title: "Content & Modules",
    items: [
      {
        label: "Jobs",
        href: "/admin/jobs",
        icon: Briefcase,
      },
      {
        label: "SAP Modules",
        href: "/admin/sap-modules",
        icon: Grid,
      },
      {
        label: "Contact Us",
        href: "/admin/contact-us",
        icon: MessageSquare,
      },
    ],
  },
  {
    title: "Platform",
    items: [
      {
        label: "General Settings",
        href: "/admin/platform/general",
        icon: Settings,
      },
      {
        label: "Social Media",
        href: "/admin/platform/social-media",
        icon: Share2,
      },
      {
        label: "Notifications",
        href: "/admin/platform/notifications",
        icon: Bell,
      },
    ],
  },
  {
    title: "Security & Governance",
    items: [
      {
        label: "Admin Management",
        href: "/admin/admin-management",
        icon: ShieldAlert,
      },
      {
        label: "Audit Logs",
        href: "/admin/audit-logs",
        icon: ScrollText,
      },
    ],
  },
];
