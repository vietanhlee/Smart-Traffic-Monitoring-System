// import { useState } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import TrafficDashboard from "./components/TrafficDashboard";
import "./App.css";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <TrafficDashboard />
        <Toaster position="top-right" richColors />
      </div>
    </ThemeProvider>
  );
}

export default App;
