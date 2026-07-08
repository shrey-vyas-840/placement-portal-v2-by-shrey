export const loadingMessages = {
  dashboard: [
    "Checking your profile...",
    "Preparing your workspace...",
    "Loading placement analytics...",
    "Generating personalized insights...",
    "Almost ready...",
  ],

  profile: [
    // "Loading your profile...",
    "Preparing personal details...",
    "Syncing academic records...",
    "Loading resume...",
    "Loading skills...",
  ],

  opportunities: [
    // "Finding opportunities...",
    "Loading companies...",
    "Checking eligibility...",
    "Matching your profile...",
    "Preparing recommendations...",
  ],

  applications: [
    // "Loading applications...",
    "Preparing application history...",
    "Checking statuses...",
    "Refreshing timeline details...",
    "Finalizing application view...",
  ],

  noc: [
    "Preparing NOC workspace...",
    // "Loading requests...",
    "Syncing review status...",
    "Checking approvals...",
    "Almost ready...",
  ],

  admin: [
    "Preparing analytics...",
    "Loading admin dashboard...",
    "Reading reports...",
    "Generating charts...",
    "Syncing control panels...",
  ],

  auth: [
  "Checking your session...",
  "Verifying your credentials...",
  "Preparing your workspace...",
  "Almost ready...",
],
} as const;

export type LoadingPage = keyof typeof loadingMessages;

export const loadingTitles: Record<LoadingPage, string> = {
  dashboard: "Loading Dashboard",
  profile: "Loading Profile",
  opportunities: "Finding Opportunities",
  applications: "Loading Applications",
  noc: "Preparing NOC Workspace",
  admin: "Loading Admin Dashboard",
  auth: "Signing You In",
} as const;