
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, ExternalLink, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ExtensionInfoCardProps {
  name: string;
  version: string;
  downloadUrl: string;
  instructionsUrl: string;
  showInfoAlert?: boolean;
}

export function ExtensionInfoCard({ 
  name, 
  version, 
  downloadUrl, 
  instructionsUrl,
  showInfoAlert = false
}: ExtensionInfoCardProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Enhance Your Analysis</CardTitle>
        <CardDescription>
          Get deeper insights with our tools
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showInfoAlert && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Using Demo Data</AlertTitle>
            <AlertDescription>
              We'll use example data to demonstrate the functionality.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="text-sm text-muted-foreground">
          <p>
            Our web tool can analyze URLs directly and provide useful insights based on your criteria.
          </p>
        </div>
        
        <div className="pt-2 text-center">
          <Link 
            to="/dashboard" 
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center"
          >
            Continue to dashboard
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
