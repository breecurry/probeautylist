import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, Phone, Mail, Edit2, Trash2, Clock } from "lucide-react";

interface StaffMember {
  id: string;
  businessId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  specialties: string[] | null;
  schedule: string | null;
  profilePhoto: string | null;
  active: boolean;
  createdAt: string;
}

interface StaffManagementProps {
  businessId: string;
}

export function StaffManagement({ businessId }: StaffManagementProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    specialties: "",
    schedule: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staff = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ["/api/businesses", businessId, "staff"],
    queryFn: async () => {
      const res = await fetch(`/api/businesses/${businessId}/staff`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch staff");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/businesses/${businessId}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          specialties: data.specialties ? data.specialties.split(",").map(s => s.trim()) : null,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses", businessId, "staff"] });
      setIsAddOpen(false);
      resetForm();
      toast({ title: "Staff member added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StaffMember> }) => {
      const res = await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update staff member");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses", businessId, "staff"] });
      setEditingStaff(null);
      resetForm();
      toast({ title: "Staff member updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/staff/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete staff member");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses", businessId, "staff"] });
      toast({ title: "Staff member removed" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", role: "", specialties: "", schedule: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      updateMutation.mutate({
        id: editingStaff.id,
        data: {
          ...formData,
          specialties: formData.specialties ? formData.specialties.split(",").map(s => s.trim()) : null,
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditDialog = (member: StaffMember) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      email: member.email || "",
      phone: member.phone || "",
      role: member.role,
      specialties: member.specialties?.join(", ") || "",
      schedule: member.schedule || "",
    });
  };

  const toggleActive = (member: StaffMember) => {
    updateMutation.mutate({ id: member.id, data: { active: !member.active } });
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading staff...</div>;
  }

  const activeStaff = staff.filter(s => s.active);
  const inactiveStaff = staff.filter(s => !s.active);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff Management
            </CardTitle>
            <CardDescription>Manage your team members and their schedules</CardDescription>
          </div>
          <Dialog open={isAddOpen || !!editingStaff} onOpenChange={(open) => {
            if (!open) {
              setIsAddOpen(false);
              setEditingStaff(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddOpen(true)} data-testid="button-add-staff">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingStaff ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="staff-name">Name *</Label>
                  <Input
                    id="staff-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name"
                    required
                    data-testid="input-staff-name"
                  />
                </div>
                <div>
                  <Label htmlFor="staff-role">Role *</Label>
                  <Input
                    id="staff-role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., Senior Stylist, Nail Technician"
                    required
                    data-testid="input-staff-role"
                  />
                </div>
                <div>
                  <Label htmlFor="staff-email">Email</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    data-testid="input-staff-email"
                  />
                </div>
                <div>
                  <Label htmlFor="staff-phone">Phone</Label>
                  <Input
                    id="staff-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    data-testid="input-staff-phone"
                  />
                </div>
                <div>
                  <Label htmlFor="staff-specialties">Specialties</Label>
                  <Input
                    id="staff-specialties"
                    value={formData.specialties}
                    onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                    placeholder="Color, Cuts, Extensions (comma-separated)"
                    data-testid="input-staff-specialties"
                  />
                </div>
                <div>
                  <Label htmlFor="staff-schedule">Schedule / Availability</Label>
                  <Textarea
                    id="staff-schedule"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    placeholder="Mon-Fri: 9am-5pm, Sat: 10am-2pm"
                    data-testid="input-staff-schedule"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-staff"
                >
                  {editingStaff ? "Update Staff Member" : "Add Staff Member"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {staff.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No staff members yet. Add your team to get started!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeStaff.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Active Staff ({activeStaff.length})</h4>
                <div className="grid gap-3">
                  {activeStaff.map((member) => (
                    <StaffCard
                      key={member.id}
                      member={member}
                      onEdit={() => openEditDialog(member)}
                      onDelete={() => deleteMutation.mutate(member.id)}
                      onToggleActive={() => toggleActive(member)}
                    />
                  ))}
                </div>
              </div>
            )}
            {inactiveStaff.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Inactive Staff ({inactiveStaff.length})</h4>
                <div className="grid gap-3 opacity-75">
                  {inactiveStaff.map((member) => (
                    <StaffCard
                      key={member.id}
                      member={member}
                      onEdit={() => openEditDialog(member)}
                      onDelete={() => deleteMutation.mutate(member.id)}
                      onToggleActive={() => toggleActive(member)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StaffCard({
  member,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  member: StaffMember;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  return (
    <div 
      className="flex items-center justify-between p-4 border rounded-lg bg-card"
      data-testid={`card-staff-${member.id}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-teal-600 font-semibold text-lg">
          {member.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium" data-testid={`text-staff-name-${member.id}`}>{member.name}</h3>
            <Badge variant="secondary" data-testid={`badge-staff-role-${member.id}`}>{member.role}</Badge>
            {!member.active && <Badge variant="outline">Inactive</Badge>}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            {member.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {member.email}
              </span>
            )}
            {member.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {member.phone}
              </span>
            )}
          </div>
          {member.specialties && member.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {member.specialties.map((spec, i) => (
                <Badge key={i} variant="outline" className="text-xs">{spec}</Badge>
              ))}
            </div>
          )}
          {member.schedule && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <Clock className="h-3 w-3" />
              {member.schedule}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 mr-4">
          <Label htmlFor={`active-${member.id}`} className="text-xs text-muted-foreground">Active</Label>
          <Switch
            id={`active-${member.id}`}
            checked={member.active}
            onCheckedChange={onToggleActive}
            data-testid={`switch-staff-active-${member.id}`}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          data-testid={`button-edit-staff-${member.id}`}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
          data-testid={`button-delete-staff-${member.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
