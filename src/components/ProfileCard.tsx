import React from 'react';
import { ProfileData } from '@/types/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Building, ExternalLink, User } from 'lucide-react';

interface ProfileCardProps {
  profile: ProfileData;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <Card className="overflow-hidden border border-gray-800 bg-black text-white">
      <CardHeader className="bg-gray-900 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-blue-400" />
          <span>{profile.name || "–"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Briefcase className="h-4 w-4 mt-1 text-blue-400 flex-shrink-0" />
            <div>
              <div className="font-semibold text-gray-400 text-xs">TITEL</div>
              {profile.title ? (
                <div className="text-blue-300">{profile.title}</div>
              ) : (
                <div className="text-gray-500 italic">Ingen titel</div>
              )}
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Building className="h-4 w-4 mt-1 text-blue-400 flex-shrink-0" />
            <div>
              <div className="font-semibold text-gray-400 text-xs">FÖRETAG</div>
              {profile.company ? (
                <div className="text-green-300">{profile.company}</div>
              ) : (
                <div className="text-gray-500 italic">Inget företag</div>
              )}
            </div>
          </div>
          
          {profile.url && (
            <div className="flex items-start gap-2">
              <ExternalLink className="h-4 w-4 mt-1 text-blue-400 flex-shrink-0" />
              <div>
                <div className="font-semibold text-gray-400 text-xs">PROFIL</div>
                <a 
                  href={profile.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-400 hover:underline truncate block"
                >
                  {profile.url}
                </a>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileCard; 