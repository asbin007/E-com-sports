import { Outlet } from "react-router-dom";
import DashboardSidebar, {
  DashboardNavTabs,
  DashboardProfileCard,
  DashboardHelpCard,
} from "./DashboardSidebar";
import { motion, useReducedMotion } from "framer-motion";

const DashboardLayout = () => {
  const reduce = useReducedMotion();

  return (
    <div className="min-h-screen bg-primary pt-4 pb-20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Mobile / tablet: nav collapses to a scrollable tab strip so the page
            content starts immediately below it. */}
        <div className="lg:hidden mb-6">
          <DashboardNavTabs />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Desktop: full sidebar column (profile + nav + help). */}
          <aside className="hidden lg:block lg:w-72 flex-shrink-0 self-start">
            <DashboardSidebar />
          </aside>

          <div className="flex-1 w-full min-w-0">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16, ease: [0.2, 0.7, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>

            {/* Mobile / tablet: secondary cards live below the outlet. */}
            <div className="lg:hidden mt-8 space-y-4">
              <DashboardProfileCard />
              <DashboardHelpCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
