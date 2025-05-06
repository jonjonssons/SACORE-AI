
import React from "react";
import { Link } from "react-router-dom";
import { Search, Users, ListFilter, BarChart, LinkedinIcon, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to LinkScore Guru. Start searching and scoring your leads.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads Found</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">254</div>
            <p className="text-xs text-muted-foreground">
              +18% from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Score Leads</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">86</div>
            <p className="text-xs text-muted-foreground">
              Leads with score &gt; 80
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Searches Run</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              5 new searches this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scoring Criteria</CardTitle>
            <ListFilter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              Active scoring criteria
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Start a new search or view your leads
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/search">
                <Search className="mr-2 h-4 w-4" />
                New Lead Search
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/criteria">
                <ListFilter className="mr-2 h-4 w-4" />
                Manage Scoring Criteria
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/leads">
                <Users className="mr-2 h-4 w-4" />
                View All Leads
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Learn how to use LinkScore Guru
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button className="w-full justify-start text-left" variant="outline">
              <User className="mr-2 h-4 w-4" />
              <div className="flex flex-col items-start">
                <span>Create your first search</span>
                <span className="text-xs text-muted-foreground">
                  Learn how to find and score leads
                </span>
              </div>
            </Button>
            <Button className="w-full justify-start text-left" variant="outline">
              <LinkedinIcon className="mr-2 h-4 w-4" />
              <div className="flex flex-col items-start">
                <span>Connect LinkedIn Sales Navigator</span>
                <span className="text-xs text-muted-foreground">
                  Set up your LinkedIn integration
                </span>
              </div>
            </Button>
            <Button className="w-full justify-start text-left" variant="outline">
              <ListFilter className="mr-2 h-4 w-4" />
              <div className="flex flex-col items-start">
                <span>Create scoring criteria</span>
                <span className="text-xs text-muted-foreground">
                  Define how leads are scored
                </span>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
