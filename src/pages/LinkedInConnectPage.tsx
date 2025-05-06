
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Linkedin } from 'lucide-react';

const LinkedInConnectPage = () => {
  const navigate = useNavigate();

  const handleConnectLinkedIn = () => {
    // TODO: Implement actual LinkedIn connection logic
    console.log('Connecting to LinkedIn...');
  };

  return (
    <div className="min-h-screen bg-[#131722] text-white">
      <div className="max-w-4xl mx-auto pt-20 px-4">
        <Card className="w-full bg-[#1A1F2C] border-[#2A2F3C] text-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text">
              Connect Your LinkedIn Account
            </CardTitle>
            <CardDescription className="text-gray-400">
              Connect your LinkedIn account to continue with the search process
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <Button 
                onClick={handleConnectLinkedIn}
                className="bg-[#0077B5] hover:bg-[#006097] text-white px-6 py-4 text-lg"
              >
                <Linkedin className="mr-2 h-6 w-6" />
                Connect with LinkedIn
              </Button>
            </div>
            
            <div className="text-center text-sm text-gray-400">
              <p>We'll use your LinkedIn credentials to access Sales Navigator</p>
              <p>Your credentials are securely stored and never shared</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LinkedInConnectPage;
