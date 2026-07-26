"use client";

import {useEffect, useState} from "react";

export default function DashboardLoading() {
  const [message, setMessage] = useState("...جاري تحميل الصفحة");

  useEffect(() => {
    const currentLang = document.documentElement.lang;
    setMessage(currentLang === "en" ? "Loading page..." : "...جاري تحميل الصفحة");
  }, []);

  return (
    <div className="dashboard-page-loading" role="status" aria-live="polite">
      <span />
      <p className="loading-text">{message}</p>
    </div>
  );
}
