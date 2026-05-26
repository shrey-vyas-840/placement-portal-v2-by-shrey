export function isValidResumeUrl(
  url: string,
): boolean {
  try {
    const parsed = new URL(url);

    const allowedHosts = [
      "drive.google.com",
      "docs.google.com",
      "onedrive.live.com",
      "1drv.ms",
      "dropbox.com",
      "www.dropbox.com",
    ];

    return allowedHosts.some(
      (host) =>
        parsed.hostname === host,
    );
  } catch {
    return false;
  }
}