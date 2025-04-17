import { LineChart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex items-center">
            <LineChart className="text-primary-700 h-5 w-5 mr-2" />
            <span className="font-medium text-neutral-900">Aetheris</span>
          </div>
          <div className="mt-4 md:mt-0">
            <p className="text-center text-sm text-neutral-500">
              &copy; {currentYear} Aetheris Career Development. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
