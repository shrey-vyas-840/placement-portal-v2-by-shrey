import { APP_METADATA } from "@/config/appMetadata";

export function PortalFooter() {
  return (
    <footer className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
      Developed by {APP_METADATA.initialDeveloper} for {APP_METADATA.organization}
    </footer>
  );
}
