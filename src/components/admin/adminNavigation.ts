import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ClipboardList,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";

export interface AdminNavigationItem {
  id: string;
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
}

export interface AdminNavigationGroup {
  id: string;
  title: string;
  items: AdminNavigationItem[];
}

export const ADMIN_NAVIGATION: AdminNavigationGroup[] = [
  {
    id: "overview",
    title: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        description: "Live overview, KPIs and analytics.",
        to: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    id: "records",
    title: "Records",
    items: [
      {
        id: "students",
        label: "Students",
        description: "Manage all students registered in the placement portal.",
        to: "/admin/students",
        icon: Users,
      },
      {
        id: "companies",
        label: "Companies",
        description: "Manage company profiles and recruiter contact information.",
        to: "/admin/companies",
        icon: Building2,
      },
      {
        id: "recruitment-register",
        label: "Drive Details",
        description: "Browse and manage every recruitment conducted by the placement cell.",
        to: "/admin/recruitment-register",
        icon: ClipboardList,
      },
    ],
  },

  {
    id: "workspace",
    title: "Recruitment Workspace",
    items: [
      {
        id: "recruitment-workspace",
        label: "Recruitment Workspace",
        description: "Create, edit, publish and manage recruitments from one workspace.",
        to: "/admin/recruitment",
        icon: FolderKanban,
      },
    ],
  },

  {
    id: "student-lifecycle",
    title: "Student Lifecycle",
    items: [
      {
        id: "onboarding",
        label: "Onboarding",
        description: "Approve, reject and manage student onboarding requests.",
        to: "/admin/onboarding-approvals",
        icon: GraduationCap,
      },
    ],
  },

  {
    id: "compliance",
    title: "Compliance",
    items: [
      {
        id: "noc",
        label: "NOC",
        description: "Issue, review and manage No Objection Certificates.",
        to: "/admin/noc",
        icon: ShieldCheck,
      },
    ],
  },
];

export const ADMIN_LAYOUT = {
  APP_NAME: "Indus Placement Nexus",
  PANEL_NAME: "Admin Control Center",
  SIDEBAR_EXPANDED_WIDTH: 320,
  SIDEBAR_COLLAPSED_WIDTH: 88,
};
