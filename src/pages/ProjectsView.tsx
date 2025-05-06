import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { ArrowLeft, FolderOpen, ChevronRight, Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  createdAt?: number; // Tidstämpel för när projektet skapades
}

export function ProjectsView() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = () => {
      setIsLoading(true);
      try {
        const savedProjects = localStorage.getItem('savedProjects');
        if (savedProjects) {
          const parsedProjects = JSON.parse(savedProjects) as Project[];
          // Sortera projekten i omvänd ordning (nyaste först)
          setProjects(parsedProjects.sort((a, b) => {
            const dateA = a.createdAt || 0;
            const dateB = b.createdAt || 0;
            return dateB - dateA;
          }));
        }
      } catch (error) {
        console.error('Error loading projects:', error);
        toast({
          title: "Error loading projects",
          description: "An error occurred while loading projects",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleOpenProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const handleDeleteProject = (projectId: string) => {
    // Förbered för borttagning, men visa bekräftelsedialog först
    setProjectToDelete(projectId);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      const updatedProjects = projects.filter(p => p.id !== projectToDelete);
      setProjects(updatedProjects);
      localStorage.setItem('savedProjects', JSON.stringify(updatedProjects));
      toast({
        title: "Project deleted",
        description: "The project has been successfully deleted"
      });
      setProjectToDelete(null);
    }
  };

  const cancelDelete = () => {
    setProjectToDelete(null);
  };
  
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Unknown date";
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        </div>

        <h1 className="text-2xl font-bold mb-6">Saved Projects</h1>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-sm text-gray-500">Loading projects...</p>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center justify-center h-64">
            <p className="text-gray-500 mb-4">No saved projects found</p>
            <Button onClick={() => navigate('/sheet-view')}>
              Go to Results View
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Profiles</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow 
                    key={project.id} 
                    className="cursor-pointer"
                    onClick={() => handleOpenProject(project.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <FolderOpen className="h-5 w-5 mr-2 text-blue-500" />
                        <span>{project.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.profiles.length} {project.profiles.length === 1 ? 'profile' : 'profiles'}
                    </TableCell>
                    <TableCell>
                      {formatDate(project.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation(); // Förhindra klick på raden
                            handleDeleteProject(project.id);
                          }}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this project and all saved profiles within it.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ErrorBoundary>
  );
} 