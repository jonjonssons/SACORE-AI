
import React from "react";
import { Sliders, LinkedinIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatInterface } from "@/components/ChatInterface";
import { SearchForm } from "@/components/SearchForm";

interface SearchTabsContainerProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const SearchTabsContainer: React.FC<SearchTabsContainerProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  return (
    <Tabs 
      defaultValue={activeTab} 
      className="w-full" 
      onValueChange={onTabChange}
    >
      <TabsList className="grid w-full md:w-[400px] grid-cols-2 p-1 rounded-xl bg-[#1A1F2C] mb-4">
        <TabsTrigger 
          value="chat" 
          className="rounded-lg data-[state=active]:bg-[#212636] data-[state=active]:text-blue-400 data-[state=active]:shadow-sm text-gray-400"
        >
          <Sliders className="mr-2 h-4 w-4" />
          Chat Interface
        </TabsTrigger>
        <TabsTrigger 
          value="form" 
          className="rounded-lg data-[state=active]:bg-[#212636] data-[state=active]:text-blue-400 data-[state=active]:shadow-sm text-gray-400"
        >
          <LinkedinIcon className="mr-2 h-4 w-4" />
          Search Form
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="chat" className="mt-6">
        <ChatInterface />
      </TabsContent>
      
      <TabsContent value="form" className="mt-6">
        <SearchForm />
      </TabsContent>
    </Tabs>
  );
};

export default SearchTabsContainer;
