import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X, Users, Building2, Calendar, Star, Trash2, Shield, UserCog } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminStats {
  totalUsers: number;
  totalBusinesses: number;
  totalBookings: number;
  totalReviews: number;
  usersByRole: { role: string; count: number }[];
  businessesByTier: { tier: string; count: number }[];
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Business {
  id: string;
  name: string;
  serviceType: string;
  tier: string;
  approved: boolean;
  ownerUsername: string;
  ownerEmail: string;
  createdAt: string;
}

export default function Admin() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Redirect non-admin users
  if (user?.role !== 'admin') {
    return <Redirect to="/" />;
  }

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: allBusinesses = [], isLoading: businessesLoading } = useQuery<Business[]>({
    queryKey: ['/api/admin/businesses'],
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: pendingBusinesses = [] } = useQuery<Business[]>({
    queryKey: ['/api/businesses/pending'],
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update role');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: "Role Updated", description: "User role has been updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user role.", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: "User Deleted", description: "The user has been removed from the platform." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" });
    },
  });

  const deleteBusinessMutation = useMutation({
    mutationFn: async (businessId: string) => {
      const res = await fetch(`/api/admin/businesses/${businessId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete business');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/businesses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: "Business Deleted", description: "The business has been removed from the platform." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete business.", variant: "destructive" });
    },
  });

  const approveBusinessMutation = useMutation({
    mutationFn: async (businessId: string) => {
      const res = await fetch(`/api/businesses/${businessId}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to approve business');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/businesses/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/businesses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: "Business Approved", description: "The business is now live on the platform." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve business.", variant: "destructive" });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'business_owner': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'gold': return 'bg-amber-100 text-amber-700';
      case 'silver': return 'bg-slate-200 text-slate-700';
      case 'bronze': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 md:px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold" data-testid="admin-title">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage users, businesses, and platform settings</p>
          </div>
          <Badge variant="outline" className="px-4 py-1 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Admin Mode
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-users">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-businesses">{stats?.totalBusinesses || 0}</p>
                  <p className="text-xs text-muted-foreground">Businesses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-bookings">{stats?.totalBookings || 0}</p>
                  <p className="text-xs text-muted-foreground">Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="stat-reviews">{stats?.totalReviews || 0}</p>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribution Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Users by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.usersByRole?.map((item) => (
                  <div key={item.role} className="flex justify-between items-center">
                    <Badge className={getRoleBadgeColor(item.role)}>
                      {item.role.replace('_', ' ')}
                    </Badge>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
                {!stats?.usersByRole?.length && (
                  <p className="text-sm text-muted-foreground">No users yet</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Businesses by Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.businessesByTier?.map((item) => (
                  <div key={item.tier} className="flex justify-between items-center">
                    <Badge className={getTierBadgeColor(item.tier)}>
                      {item.tier}
                    </Badge>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
                {!stats?.businessesByTier?.length && (
                  <p className="text-sm text-muted-foreground">No businesses yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending Approvals ({pendingBusinesses.length})
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="businesses" data-testid="tab-businesses">Businesses</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Business Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingBusinesses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Check className="w-12 h-12 mx-auto mb-4 text-amber-600" />
                    <p>All caught up! No pending approvals.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingBusinesses.map((business: any) => (
                        <TableRow key={business.id}>
                          <TableCell className="font-medium">{business.name}</TableCell>
                          <TableCell>{business.serviceType}</TableCell>
                          <TableCell>{business.ownerUsername || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge className={getTierBadgeColor(business.tier)}>{business.tier}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                                onClick={() => approveBusinessMutation.mutate(business.id)}
                                data-testid={`approve-${business.id}`}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <X className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reject Business?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete this business application. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteBusinessMutation.mutate(business.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Reject & Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading users...</p>
                ) : allUsers.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No users found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.username}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Select
                              value={u.role}
                              onValueChange={(role) => updateRoleMutation.mutate({ userId: u.id, role })}
                              disabled={u.id === user?.id}
                            >
                              <SelectTrigger className="w-[140px]" data-testid={`role-select-${u.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="client">Client</SelectItem>
                                <SelectItem value="business_owner">Business Owner</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{formatDate(u.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            {u.id !== user?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete this user and all their associated data. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteUserMutation.mutate(u.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete User
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="businesses">
            <Card>
              <CardHeader>
                <CardTitle>All Businesses</CardTitle>
              </CardHeader>
              <CardContent>
                {businessesLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading businesses...</p>
                ) : allBusinesses.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No businesses registered yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allBusinesses.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">{b.name}</TableCell>
                          <TableCell>{b.serviceType}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{b.ownerUsername}</p>
                              <p className="text-xs text-muted-foreground">{b.ownerEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTierBadgeColor(b.tier)}>{b.tier}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={b.approved ? "default" : "secondary"}>
                              {b.approved ? "Approved" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Business?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete this business and all associated bookings, reviews, and portfolio items. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteBusinessMutation.mutate(b.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete Business
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
