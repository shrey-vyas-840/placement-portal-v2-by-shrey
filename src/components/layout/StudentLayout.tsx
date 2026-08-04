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

      <main
  className="
    min-w-0
    flex-1
    px-5
    py-8
    sm:px-6
    lg:px-8
    xl:px-10
    2xl:px-12
  "
>
        {children}
      </main>
    </div>
  );
}