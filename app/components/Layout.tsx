"use client";

import { FiMoon, FiSun, FiGithub, FiSettings, FiLogOut } from "react-icons/fi";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Traqr
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">by Hugo</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <FiSun className="text-yellow-500" /> : <FiMoon className="text-gray-700" />}
              </button>
              <a
                href="https://github.com/ton-username/traqr-next"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="GitHub"
              >
                <FiGithub className="text-gray-600 dark:text-gray-300" />
              </a>
              {user && (
                <>
                  <Link
                    href="/settings"
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Settings"
                  >
                    <FiSettings className="text-gray-600 dark:text-gray-300" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Logout"
                  >
                    <FiLogOut className="text-gray-600 dark:text-gray-300" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Made with ❤️ by Hugo | Powered by{" "}
            <a href="https://mistral.ai" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              Mistral AI
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}