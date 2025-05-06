
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="flex items-center text-gray-600" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold mb-8 text-black">Privacy Policy</h1>
        
        <div className="prose max-w-none text-black">
          <p className="text-black mb-4">
            Last updated: 2025-04-07
          </p>
          
          <p className="text-black mb-4">
            This Privacy Policy outlines how SACORE AB ("we," "our," or "us") collects, uses, and safeguards your information when using our Chrome extension, designed to generate AI-powered job requirement profiles and score LinkedIn candidates via URL input.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-black">Information We Collect</h2>
          
          <p className="text-black mb-2">
            <strong>Personally Identifiable Information:</strong>
          </p>
          <p className="text-black mb-4">
            Publicly available information from LinkedIn profiles when a user manually inputs a URL. This includes names, job titles, and professional history.
          </p>
          
          <p className="text-black mb-2">
            <strong>LinkedIn Data Portability and User Consent:</strong>
          </p>
          <p className="text-black mb-4">
            When using our integration with LinkedIn's Data Portability APIs, all data is accessed with the explicit consent of the user. This data may include profile details such as name, experience, skills, and education, provided voluntarily by the user through LinkedIn's official authentication flow.
          </p>
          <p className="text-black mb-4">
            We do not access, scrape, or store LinkedIn data without the user's direct request and approval. All data is used solely for the purpose of generating AI-based job requirement profiles and scoring against provided job criteria.
          </p>
          <p className="text-black mb-4">
            Users can revoke access or request deletion of imported data at any time by contacting us at jon@sacore.io.
          </p>
          
          <p className="text-black mb-2">
            <strong>Location Information:</strong>
          </p>
          <p className="text-black mb-4">
            We collect IP addresses for security, diagnostics, and usage analysis.
          </p>
          
          <p className="text-black mb-2">
            <strong>User Activity:</strong>
          </p>
          <p className="text-black mb-4">
            We track interactions with the extension (e.g., button clicks) to improve performance and user experience.
          </p>
          
          <p className="text-black mb-2">
            <strong>Website Content:</strong>
          </p>
          <p className="text-black mb-4">
            We extract and process text data from LinkedIn pages accessed through the extension to generate candidate scoring and requirement profiles.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-black">How We Use This Information</h2>
          
          <ul className="list-disc pl-5 mb-4 text-black">
            <li className="mb-2 text-black">To generate AI-powered job requirement profiles and score candidates based on their LinkedIn data.</li>
            <li className="mb-2 text-black">To enhance app performance, identify errors, and guide future improvements.</li>
            <li className="mb-2 text-black">To maintain security and usage monitoring.</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-black">Data Storage and Security</h2>
          <p className="text-black mb-4">
            All data is securely handled. No information is sold, rented, or shared for commercial use. We implement security best practices to protect user information and comply with all applicable data protection laws.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-black">Sharing and Third Parties</h2>
          <p className="text-black mb-4">
            We do not share your data with third parties unless required to fulfill the core functions of the extension (e.g., AI service providers for processing input). These services only receive anonymized or job-relevant data and are bound by strict confidentiality agreements.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-black">Remote Code</h2>
          <p className="text-black mb-4">
            We do not use remote code. All scripts are contained within the extension package, and no external scripts are loaded dynamically from third-party sources.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-black">User Rights and Controls</h2>
          <p className="text-black mb-4">
            You can request access to or deletion of your personal data at any time by contacting us. We respect user privacy and act promptly on such requests.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-black">Compliance Statement</h2>
          <p className="text-black mb-4">By publishing this extension, we certify:</p>
          <ul className="list-disc pl-5 mb-4 text-black">
            <li className="mb-2 text-black">We do not sell or transfer user data to third parties outside of approved functional use.</li>
            <li className="mb-2 text-black">We do not use user data for unrelated purposes.</li>
            <li className="mb-2 text-black">We do not evaluate user creditworthiness or use data for lending.</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-black">Updates to This Policy</h2>
          <p className="text-black mb-4">
            We may update this Privacy Policy as the product evolves. Any significant changes will be posted here and within the Chrome Web Store listing.
          </p>
          
          <h2 className="text-xl font-semibold mt-8 mb-4 text-black">Contact</h2>
          <p className="text-black mb-4">
            If you have any questions, concerns, or requests, contact us at:
            <br />
            jon@sacore.io
          </p>
        </div>
      </div>
      
      <footer className="text-center py-8 border-t">
        <div className="text-sm text-black">
          &copy; {new Date().getFullYear()} SACORE AB. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
