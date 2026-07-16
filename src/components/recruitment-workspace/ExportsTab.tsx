import { useEffect, useState } from "react";

interface Props {
  opportunityId: string | null;
}

export function ExportsTab({
  opportunityId,
}: Props) {
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    setLoading(false);
  }, [opportunityId]);

  if (!opportunityId) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
        Recruitment has not been published yet.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
        Loading export center...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-8">

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-semibold">
            Export Center
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Export recruitment responses in CSV or Excel format.
          </p>

        </div>

      </div>

      <div className="mt-10 rounded-xl border border-dashed p-12 text-center text-muted-foreground">

        Export configuration will be built next.

      </div>

    </div>
  );
}