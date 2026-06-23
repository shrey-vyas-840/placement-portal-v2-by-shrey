import { APP_METADATA } from "@/config/appMetadata";

export function BuildInfo() {
  return (
    <div
      hidden
      aria-hidden="true"
      data-app-name={APP_METADATA.appName}
      data-short-name={APP_METADATA.shortName}
      data-version={APP_METADATA.version}
      data-author={APP_METADATA.initialDeveloper}
      data-organization={APP_METADATA.organization}
      data-tagline={APP_METADATA.tagline}
    />
  );
}
