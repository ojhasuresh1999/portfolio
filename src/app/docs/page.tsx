"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocPage() {
  return (
    <div className="bg-white dark:bg-gray-100 min-h-screen">
      <div className="container mx-auto py-10">
        <SwaggerUI url="/swagger.json" />
      </div>
    </div>
  );
}
  