"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/hooks/use-auth";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateInitials } from "@/lib/utils";
import { Camera, Mail, Phone, Calendar, Shield } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [fullNameEn, setFullNameEn] = React.useState(user?.fullNameEn || "");
  const [fullNameAr, setFullNameAr] = React.useState(user?.fullNameAr || "");
  const [phone, setPhone] = React.useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [changingPassword, setChangingPassword] = React.useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.patch("/auth/profile", { fullNameEn, fullNameAr, phone });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("nav.profile")}</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information and settings
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 text-center">
            <div className="relative inline-block mb-4">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {user ? generateInitials(user.fullNameEn) : "U"}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 rounded-full bg-primary text-primary-foreground p-1.5 shadow-lg hover:bg-primary/90 transition-colors">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <h2 className="text-xl font-semibold">{user?.fullNameEn}</h2>
            <Badge variant="gold" className="mt-2 capitalize">
              {user?.role}
            </Badge>
            <Separator className="my-4" />
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user?.phone || "Not provided"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{user?.role}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Personal Information</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input label="Full Name (English)" placeholder="John Doe" value={fullNameEn} onChange={(e) => setFullNameEn(e.target.value)} />
                    <Input label="Full Name (Arabic)" placeholder="محمد أحمد" value={fullNameAr} onChange={(e) => setFullNameAr(e.target.value)} />
                  </div>
                  <Input label="Email" placeholder="Email" type="email" defaultValue={user?.email} disabled />
                  <Input label="Phone" placeholder="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => { setFullNameEn(user?.fullNameEn || ""); setFullNameAr(user?.fullNameAr || ""); setPhone(user?.phone || ""); }}>Cancel</Button>
                    <Button onClick={handleSaveProfile} loading={saving}>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Update your password and security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input label="Current Password" placeholder="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  <Input label="New Password" placeholder="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <Input label="Confirm New Password" placeholder="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}>Cancel</Button>
                    <Button onClick={handleChangePassword} loading={changingPassword}>Update Password</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </motion.div>
  );
}
