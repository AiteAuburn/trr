import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";

const RootApp = window.location.pathname.startsWith("/admin")
  ? lazy(() => import("./AdminApp").then((module) => ({ default: module.AdminApp })))
  : lazy(() => import("./App").then((module) => ({ default: module.App })));

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<main className="admin-shell"><p>正在載入…</p></main>}>
      <RootApp />
    </Suspense>
  </React.StrictMode>
);
