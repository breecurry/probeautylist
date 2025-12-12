import { useState } from "react";
import { MOCK_BUSINESSES } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X, FileText, ExternalLink } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { toast } = useToast();
  // Mock some pending businesses
  const [pendingBusinesses, setPendingBusinesses] = useState([
    {
      id: 101,
      name: "Serenity Spa & Wellness",
      owner: "Amanda Lee",
      type: "Massage Therapist",
      submittedAt: "2023-10-25",
      certificate: "cert_amanda_lee.pdf",
      status: "pending"
    },
    {
      id: 102,
      name: "Bold & Beautiful",
      owner: "Marcus Johnson",
      type: "Barber",
      submittedAt: "2023-10-26",
      certificate: "license_marcus.jpg",
      status: "pending"
    }
  ]);

  const handleApprove = (id: number) => {
    setPendingBusinesses(prev => prev.filter(b => b.id !== id));
    toast({
      title: "Business Approved",
      description: "The business is now live on the platform.",
      variant: "default",
    });
  };

  const handleReject = (id: number) => {
    setPendingBusinesses(prev => prev.filter(b => b.id !== id));
    toast({
      title: "Business Rejected",
      description: "The owner has been notified.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 md:px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif font-bold">Admin Dashboard</h1>
          <Badge variant="outline" className="px-4 py-1">Admin Mode</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingBusinesses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Check className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p>All caught up! No pending approvals.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Certificate</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingBusinesses.map((business) => (
                    <TableRow key={business.id}>
                      <TableCell className="font-medium">{business.name}</TableCell>
                      <TableCell>{business.owner}</TableCell>
                      <TableCell>{business.type}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="gap-2">
                          <FileText className="w-3 h-3" /> View
                        </Button>
                      </TableCell>
                      <TableCell>{business.submittedAt}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApprove(business.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleReject(business.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Active Businesses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_BUSINESSES.slice(0, 3).map(b => (
              <Card key={b.id} className="bg-gray-50">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.owner} • {b.tier.toUpperCase()}</p>
                  </div>
                  <Button variant="ghost" size="sm"><ExternalLink className="w-4 h-4" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
