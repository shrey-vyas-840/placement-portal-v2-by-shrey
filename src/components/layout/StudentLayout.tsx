import { ReactNode } from "react";
import { StudentSidebar } from "./StudentSidebar";

interface StudentLayoutProps {
  children: ReactNode;
  completionName: string;
  completionPercentage: number;
}

export function StudentLayout({
  children,
  completionName,
  completionPercentage,
}: StudentLayoutProps) {
  return (
    <div className="min-h-screen bg-background lg:flex">
      <StudentSidebar
        completionName={completionName}
        completionPercentage={completionPercentage}
      />

      <main className="flex-1 px-6 py-10 sm:px-8 lg:px-10">
        {children}
      </main>
    </div>
  );
}