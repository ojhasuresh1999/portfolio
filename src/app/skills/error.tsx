"use client";

import ErrorBoundary from "@/components/ui/error-boundary";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundary
      error={error}
      reset={reset}
      title="Skills Error"
      message="We encountered an anomaly while attempting to load the Skills module. Please reboot the sequence."
    />
  );
}
