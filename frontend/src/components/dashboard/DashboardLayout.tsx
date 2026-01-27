import { Outlet } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import { motion } from "framer-motion";

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-white pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          {/* Sidebar */}
          <DashboardSidebar />

          {/* Main Content Pane */}
          <div className="flex-1 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="bg-gray-50/50 rounded-[3rem] p-8 lg:p-12 border border-gray-100 min-h-[600px] relative overflow-hidden"
            >
              {/* Decorative Subtle Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />

              <div className="relative z-10">
                <Outlet />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
