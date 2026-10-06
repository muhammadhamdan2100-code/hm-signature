import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { captureVisit } from "../services/analyticsCapture";

/**
 * Records the arrival of a visit once per browser session, and re-arms when the
 * shopper returns to a page they had not seen in this tab. Mounted beside
 * ScrollToTop because it needs the same thing: a router location.
 *
 * The admin panel is deliberately excluded — staff browsing is not customer
 * demand, and counting it would inflate every funnel stage.
 */
export default function AnalyticsBeacon() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    captureVisit();
  }, [pathname]);

  return null;
}
