import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { ArrowLeft, ExternalLink, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

interface LinkRow {
  id: string;
  url: string;
  name?: string;
  title?: string;
  company?: string;
  location?: string;
  score: number;
  metadata?: {
    matchedRequirements?: string[];
    unmatchedRequirements?: string[];
    snippet?: string;
  };
}

interface Project {
  id: string;
  name: string;
  profiles: LinkRow[];
}

export function ProjectView() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProject = () => {
      setIsLoading(true);
      try {
        const savedProjects = localStorage.getItem('savedProjects');
        if (savedProjects) {
          const projects = JSON.parse(savedProjects) as Project[];
          const foundProject = projects.find(p => p.id === projectId);
          
          if (foundProject) {
            setProject(foundProject);
          } else {
            toast({
              title: "Project not found",
              description: "The requested project could not be found",
              variant: "destructive"
            });
            navigate('/');
          }
        } else {
          toast({
            title: "No projects found",
            description: "There are no saved projects",
            variant: "destructive"
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error loading project:', error);
        toast({
          title: "Error loading project",
          description: "An error occurred while loading the project",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId, navigate]);

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied",
      description: "LinkedIn URL copied to clipboard"
    });
  };

  const downloadCSV = () => {
    if (!project) return;
    
    const headers = ['Name', 'Title', 'Company', 'Location', 'Score', 'LinkedIn URL', 'Matched Requirements'];
    const rows = project.profiles.map(profile => {
      return [
        profile.name || '',
        profile.title || '',
        profile.company || '',
        profile.location || '',
        profile.score.toString(),
        profile.url,
        profile.metadata?.matchedRequirements?.join(', ') || ''
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ErrorFallback = ({ error }: { error: Error }) => (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 m-6">
      <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Something went wrong:</h3>
      <p className="text-sm text-red-700 dark:text-red-300 mt-2">{error.message}</p>
      <Button onClick={() => navigate('/')} className="mt-4">Go to Home</Button>
    </div>
  );

  return (
    <ErrorBoundary fallbackRender={ErrorFallback}>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
          
          {project && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={downloadCSV}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-sm text-gray-500">Loading project data...</p>
            </div>
          </div>
        ) : project ? (
          <>
            <h1 className="text-2xl font-bold mb-6">{project.name}</h1>
            
            <div className="rounded-lg border border-gray-200 dark:border-gray-800">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>LinkedIn URL</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        {profile.name || 'Not available'}
                      </TableCell>
                      <TableCell>
                        {profile.title || 'Not available'}
                      </TableCell>
                      <TableCell>
                        {profile.company || 'Not available'}
                      </TableCell>
                      <TableCell>
                        {profile.location || 'Not available'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div 
                            className={`px-3 py-1 rounded-full text-sm font-bold
                              ${profile.score >= 3 ? 'bg-green-500 text-white' : 
                                profile.score >= 1 ? 'bg-yellow-500 text-white' : 
                                'bg-gray-300 text-gray-700'}
                            `}
                          >
                            {profile.score}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a 
                          href={profile.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-500 hover:underline flex items-center gap-1"
                        >
                          {profile.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyLink(profile.url)}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            asChild
                          >
                            <a href={profile.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4 text-sm text-gray-500 text-center">
              {project.profiles.length} profiles in this project
            </div>
          </>
        ) : (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center justify-center h-64">
            <p className="text-gray-500 mb-4">Project not found</p>
            <Button onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
} 