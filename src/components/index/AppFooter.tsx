import React from "react";
import { Link } from "react-router-dom";

const AppFooter = () => {
  return (
    <footer className="text-center py-8 px-4 border-t border-gray-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-transparent bg-clip-text">
              Linkedscore
              <span className="text-xs font-normal text-gray-500 ml-2">by Linkedscore</span>
            </h3>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Features</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Pricing</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">About</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Contact</a>
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-4">
          &copy; {new Date().getFullYear()} Linkedscore. All rights reserved.
          <Link to="/privacy-policy" className="ml-2 hover:underline text-gray-600">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
