'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!user) {
    return null;
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8">Profile</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">
                {getInitials(user.first_name, user.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">
                {user.first_name} {user.last_name}
              </CardTitle>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />

          <div className="grid gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Email Address</h3>
              <p className="text-base">{user.email}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Full Name</h3>
              <p className="text-base">
                {user.first_name} {user.last_name}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Account Role</h3>
              <p className="text-base capitalize">{user.role}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">User ID</h3>
              <p className="text-base font-mono text-sm">{user.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
