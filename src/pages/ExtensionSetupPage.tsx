
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Check, ChevronRight } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";

export default function ExtensionSetupPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Analysis Tool Setup</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Using our LinkedIn Analysis Tool</CardTitle>
            <CardDescription>Follow these steps to enhance your experience</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6 bg-blue-50">
              <Info className="h-4 w-4" />
              <AlertTitle>Enhanced LinkedIn Analysis</AlertTitle>
              <AlertDescription>
                Our web tools provide powerful analysis of LinkedIn profiles and search results.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">1</div>
                <div>
                  <h3 className="font-medium text-lg">Understand our analysis capabilities</h3>
                  <p className="text-muted-foreground mb-2">
                    Learn how our tools can help with your search
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start gap-4">
                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">2</div>
                <div>
                  <h3 className="font-medium text-lg">Enter your search criteria</h3>
                  <p className="text-muted-foreground">Be specific with your requirements to get the best results</p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>More specific criteria lead to better matches</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start gap-4">
                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">3</div>
                <div>
                  <h3 className="font-medium text-lg">Review your results</h3>
                  <p className="text-muted-foreground">Analyze the findings to find the best candidates</p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Sort and filter to narrow down your options</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-start gap-4">
                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">4</div>
                <div>
                  <h3 className="font-medium text-lg">Start analyzing LinkedIn data</h3>
                  <p className="text-muted-foreground">Return to the app and start using our LinkedIn analysis features</p>
                  <Link to="/linkedin-analysis">
                    <Button 
                      variant="outline" 
                      className="mt-2 flex items-center gap-2"
                    >
                      Go to LinkedIn Analysis
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
            <CardDescription>Common issues and solutions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Analysis not working</h3>
              <p className="text-sm text-muted-foreground">Ensure you're using valid LinkedIn URLs and try again</p>
            </div>
            
            <div>
              <h3 className="font-medium">Need more help?</h3>
              <p className="text-sm text-muted-foreground">Contact our support team at support@example.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
