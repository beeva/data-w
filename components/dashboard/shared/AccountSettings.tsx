"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile, uploadAvatar, deleteAvatar } from "@/lib/services/profileService";
import { resizeImage, validateImageFile, getOptimalImageFormat } from "@/lib/utils/imageUtils";
import type { UserProfile } from "@/types/user";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { LocationMapPreview } from "@/components/ui/location-map-preview";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import ToastNotification from "@/components/ui/toast-notification";
import { cn } from "@/lib/utils";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Globe,
  Shield,
  CheckCircle2,
  Loader2,
  Save,
  Camera,
  Trash2,
  Upload,
  Lock,
  Eye,
  EyeOff,
  UserCircle,
  Contact,
  CalendarDays,
} from "lucide-react";

type TabId = "profile" | "security" | "contact";

interface FormData {
  full_name: string;
  phone: string;
  bio: string;
  location_address: string;
  location_city: string;
  location_country: string;
  location_lat: string;
  location_lng: string;
  company_name: string;
  company_website: string;
}

const TABS: { id: TabId; label: string; desc: string; icon: React.ElementType }[] = [
  { id: "profile",  label: "My Profile",           desc: "Avatar & bio",         icon: UserCircle },
  { id: "security", label: "Password & Security",  desc: "Change your password", icon: Lock },
  { id: "contact",  label: "Contact Info",          desc: "Name, phone & address",icon: Contact },
];

export default function AccountSettings() {
  const { user, profile, loading: authLoading, refreshProfile, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  // Avatar / profile state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showDeleteAvatarConfirm, setShowDeleteAvatarConfirm] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form state
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Contact form state
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState("");

  // Password state
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordToast, setPasswordToast] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    phone: "",
    bio: "",
    location_address: "",
    location_city: "",
    location_country: "",
    location_lat: "",
    location_lng: "",
    company_name: "",
    company_website: "",
  });

  const hasLocationCoordinates =
    formData.location_lat.trim() !== "" && formData.location_lng.trim() !== "";
  const locationLat = hasLocationCoordinates ? parseFloat(formData.location_lat) : NaN;
  const locationLng = hasLocationCoordinates ? parseFloat(formData.location_lng) : NaN;

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        location_address: profile.location?.address || "",
        location_city: profile.location?.city || "",
        location_country: profile.location?.country || "",
        location_lat: profile.location?.lat != null ? String(profile.location.lat) : "",
        location_lng: profile.location?.lng != null ? String(profile.location.lng) : "",
        company_name: profile.company_name || "",
        company_website: profile.company_website || "",
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Save bio only
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess(false);
    try {
      const { error: updateError } = await updateProfile(user.id, {
        bio: formData.bio || null,
      });
      if (updateError) throw updateError;
      setProfileSuccess(true);
      await refreshProfile();
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  // Save contact info
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setContactLoading(true);
    setContactError("");
    setContactSuccess(false);
    try {
      const updates: Partial<UserProfile> = {
        full_name: formData.full_name || null,
        phone: formData.phone || null,
        location: {
          address: formData.location_address || undefined,
          city: formData.location_city || undefined,
          country: formData.location_country || undefined,
          lat: formData.location_lat ? parseFloat(formData.location_lat) : undefined,
          lng: formData.location_lng ? parseFloat(formData.location_lng) : undefined,
        },
        company_name: formData.company_name || null,
        company_website: formData.company_website || null,
      };
      if (!formData.location_address && !formData.location_city && !formData.location_country) {
        updates.location = null;
      }
      const { error: updateError } = await updateProfile(user.id, updates);
      if (updateError) throw updateError;
      setContactSuccess(true);
      await refreshProfile();
    } catch (err: any) {
      setContactError(err.message || "Failed to update contact info");
    } finally {
      setContactLoading(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const validation = validateImageFile(file, 5);
    if (!validation.isValid) {
      setAvatarError(validation.error || "Invalid image file");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setUploadingAvatar(true);
    setAvatarError("");
    try {
      const outputFormat = getOptimalImageFormat();
      const resizedFile = await resizeImage(file, {
        maxWidth: 256,
        maxHeight: 256,
        quality: 0.9,
        outputFormat,
      });
      const { error: uploadError } = await uploadAvatar(user.id, resizedFile);
      if (uploadError) throw uploadError;
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      setAvatarError(err.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAvatar = () => setShowDeleteAvatarConfirm(true);

  const confirmDeleteAvatar = async () => {
    if (!user || !profile?.avatar_url) return;
    setUploadingAvatar(true);
    setAvatarError("");
    try {
      const { error: deleteError } = await deleteAvatar(user.id);
      if (deleteError) throw deleteError;
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      setAvatarError(err.message || "Failed to delete avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordError("");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPasswordError("");
    if (!passwordData.current_password) {
      setPasswordError("Current password is required");
      return;
    }
    if (passwordData.new_password.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const verifyRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: supabaseKey },
        body: JSON.stringify({ email: user.email, password: passwordData.current_password }),
      });
      if (!verifyRes.ok) throw new Error("Current password is incorrect");
      const { access_token } = await verifyRes.json();
      const updateRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({ password: passwordData.new_password }),
      });
      if (!updateRes.ok) {
        const err = await updateRes.json().catch(() => null);
        throw new Error(err?.msg || err?.message || "Failed to update password");
      }
      setPasswordLoading(false);
      setPasswordToast(true);
      setTimeout(async () => {
        await signOut();
        router.replace("/login");
      }, 2000);
      return;
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const getVerificationBadge = (tier: string | null) => {
    const colors: Record<string, string> = {
      bronze: "bg-amber-600",
      silver: "bg-gray-400",
      gold: "bg-yellow-500",
      platinum: "bg-purple-500",
    };
    return (
      <Badge className={`${colors[tier || "bronze"]} text-white capitalize text-[9px] px-1.5 py-0`}>
        <Shield className="w-2.5 h-2.5 mr-0.5" />
        {tier || "Bronze"}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      requester: "bg-blue-500",
      collector: "bg-green-500",
      agent: "bg-purple-500",
      admin: "bg-red-500",
    };
    return (
      <Badge className={`${colors[role] || "bg-gray-500"} text-white capitalize text-[9px] px-1.5 py-0`}>
        {role}
      </Badge>
    );
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || "U";
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {passwordToast && (
        <ToastNotification
          title="Password changed"
          message="Password changed successfully. Signing out..."
          type="success"
          duration={2500}
          onClose={() => setPasswordToast(false)}
        />
      )}

      <div className="p-2 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account</p>
        </div>

        <div className="flex gap-6 items-start">
          {/* ── Left Sidebar ── */}
          <aside className="w-64 shrink-0">
            <Card className="dark:bg-gray-800/50 border-none shadow-sm pt-6">
              <CardHeader className="px-6 pb-0">
                {/* Avatar + user info */}
                <div className="flex flex-col items-center gap-3 text-center pb-4">
                  <div className="relative">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="text-lg bg-cyan-500 text-white">
                        {getInitials(profile?.full_name || null, profile?.email || "")}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      disabled={uploadingAvatar}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-sm hover:bg-muted transition-colors"
                    >
                      {uploadingAvatar
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Camera className="w-3 h-3" />}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold leading-tight">
                      {profile?.full_name || "No name set"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {profile?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {profile && getRoleBadge(profile.role)}
                    {profile && getVerificationBadge(profile.verification_tier)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-6 pt-2 pb-4">
                {/* Navigation label */}
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Settings
                </p>

                {/* Tab nav */}
                <div className="flex flex-col gap-0.5">
                  {TABS.map(({ id, label, desc, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={cn(
                        "group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                        activeTab === id
                          ? "bg-cyan-500/10 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400"
                          : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-foreground",
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                        activeTab === id ? "bg-cyan-500/20" : "",
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-none">{label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Account info footer */}
                <div className="mt-4 pt-4 border-t border-border dark:border-gray-700 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Account Info
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Joined{" "}
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 shrink-0" />
                    <span className="capitalize">{profile?.verification_tier || "Bronze"} tier</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Right – Tab Content */}
          <div className="flex-1 min-w-0">
            {/* ── MY PROFILE ── */}
            {activeTab === "profile" && (
              <Card className="dark:bg-gray-800/50 border-none shadow-sm">
                <CardHeader className="py-4 px-6">
                  <CardTitle className="text-sm font-semibold">My Profile</CardTitle>
                  <CardDescription className="text-xs">
                    Update your profile photo and bio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 py-4 px-6">
                  {/* Photo section */}
                  <div className="flex items-center gap-5 p-4 rounded-xl bg-muted/40 border border-border/50">
                    <Avatar className="w-16 h-16 shrink-0">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="text-base bg-cyan-500 text-white">
                        {getInitials(profile?.full_name || null, profile?.email || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium">Profile Photo</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG or WebP · max 5 MB</p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleAvatarClick}
                          disabled={uploadingAvatar}
                          className="text-xs h-7 px-3 gap-1.5"
                        >
                          {uploadingAvatar
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Upload className="w-3.5 h-3.5" />}
                          {profile?.avatar_url ? "Change Photo" : "Upload Photo"}
                        </Button>
                        {profile?.avatar_url && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleDeleteAvatar}
                            disabled={uploadingAvatar}
                            className="text-xs h-7 px-3 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </Button>
                        )}
                      </div>
                      {avatarError && (
                        <p className="text-xs text-red-500">{avatarError}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Bio */}
                  <form onSubmit={handleProfileSubmit} className="space-y-3">
                    {profileError && (
                      <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-xs">
                        {profileError}
                      </div>
                    )}
                    {profileSuccess && (
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-600 dark:text-green-400 text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Saved!
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label htmlFor="bio" className="text-xs">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell us a bit about yourself..."
                        rows={4}
                        className="text-sm min-h-[80px]"
                      />
                    </div>

                    {/* Collector Stats */}
                    {profile?.role === "collector" && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-xs font-semibold mb-2">Collector Stats</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { label: "Earnings", value: `$${profile.total_earnings?.toFixed(2) || "0.00"}` },
                              { label: "Submissions", value: profile.total_submissions || 0 },
                              { label: "Completed", value: profile.completed_tasks || 0 },
                              { label: "Rating", value: `${profile.rating?.toFixed(1) || "0.0"}` },
                            ].map((stat) => (
                              <div key={stat.label} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-center">
                                <p className="text-sm font-bold text-cyan-500">{stat.value}</p>
                                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Agent Stats */}
                    {profile?.role === "agent" && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-xs font-semibold mb-2">Validator Stats</h3>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: "Validations", value: profile.total_validations || 0 },
                              { label: "Score", value: `${profile.validation_score?.toFixed(1) || "0.0"}%` },
                            ].map((stat) => (
                              <div key={stat.label} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-center">
                                <p className="text-sm font-bold text-cyan-500">{stat.value}</p>
                                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex justify-end">
                      <Button type="submit" disabled={profileLoading} size="sm" className="h-8 text-xs px-3">
                        {profileLoading ? (
                          <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Saving...</>
                        ) : (
                          <><Save className="w-3.5 h-3.5 mr-1" />Save</>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ── PASSWORD & SECURITY ── */}
            {activeTab === "security" && (
              <Card className="dark:bg-gray-800/50 border-none shadow-sm">
                <CardHeader className="py-4 px-6">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Password &amp; Security
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Update your account password
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-4 px-6">
                  <form onSubmit={handlePasswordSubmit} className="space-y-3">
                    {passwordError && (
                      <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-xs">
                        {passwordError}
                      </div>
                    )}

                    {/* Account info row */}
                    <div className="p-2.5 rounded-md bg-muted/50 flex items-center gap-2.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Signed in as</p>
                        <p className="text-sm font-medium">{profile?.email}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <Label htmlFor="current_password" className="text-xs">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current_password"
                          name="current_password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.current_password}
                          onChange={handlePasswordChange}
                          placeholder="Enter current password"
                          className="text-sm pr-9"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-9 w-9 p-0"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="new_password" className="text-xs">New Password</Label>
                        <div className="relative">
                          <Input
                            id="new_password"
                            name="new_password"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordData.new_password}
                            onChange={handlePasswordChange}
                            placeholder="At least 6 characters"
                            className="text-sm pr-9"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-9 w-9 p-0"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="confirm_password" className="text-xs">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirm_password"
                            name="confirm_password"
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordData.confirm_password}
                            onChange={handlePasswordChange}
                            placeholder="Re-enter new password"
                            className="text-sm pr-9"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-9 w-9 p-0"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={passwordLoading} size="sm" className="h-8 text-xs px-3">
                        {passwordLoading ? (
                          <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Updating...</>
                        ) : (
                          <><Lock className="w-3.5 h-3.5 mr-1" />Change Password</>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ── CONTACT INFO ── */}
            {activeTab === "contact" && (
              <Card className="dark:bg-gray-800/50 border-none shadow-sm">
                <CardHeader className="py-4 px-6">
                  <CardTitle className="text-sm font-semibold">Contact Info</CardTitle>
                  <CardDescription className="text-xs">
                    Update your name, phone and address
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-4 px-6">
                  <form onSubmit={handleContactSubmit} className="space-y-3">
                    {contactError && (
                      <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-xs">
                        {contactError}
                      </div>
                    )}
                    {contactSuccess && (
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-600 dark:text-green-400 text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Saved!
                      </div>
                    )}

                    {/* Name + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="full_name" className="text-xs">
                          <User className="w-3 h-3 inline mr-1" />
                          Full Name
                        </Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          placeholder="Enter your full name"
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="phone" className="text-xs">
                          <Phone className="w-3 h-3 inline mr-1" />
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+1 (555) 000-0000"
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Address */}
                    <div>
                      <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        Address
                      </h3>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label htmlFor="location_address" className="text-xs">Street Address</Label>
                          <AddressAutocomplete
                            value={formData.location_address}
                            onChange={(value) =>
                              setFormData((prev) => ({ ...prev, location_address: value }))
                            }
                            onSelect={(result) => {
                              setFormData((prev) => ({
                                ...prev,
                                location_address: result.address,
                                location_city: result.city || prev.location_city,
                                location_country: result.country || prev.location_country,
                                location_lat: result.lat != null ? String(result.lat) : prev.location_lat,
                                location_lng: result.lng != null ? String(result.lng) : prev.location_lng,
                              }));
                            }}
                            placeholder="Start typing to search..."
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="location_city" className="text-xs">City</Label>
                            <Input
                              id="location_city"
                              name="location_city"
                              value={formData.location_city}
                              readOnly
                              placeholder="Auto-filled from address"
                              className="text-sm bg-muted/50 cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="location_country" className="text-xs">Country</Label>
                            <Input
                              id="location_country"
                              name="location_country"
                              value={formData.location_country}
                              readOnly
                              placeholder="Auto-filled from address"
                              className="text-sm bg-muted/50 cursor-not-allowed"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="location_lat" className="text-xs">Latitude</Label>
                            <Input
                              id="location_lat"
                              name="location_lat"
                              value={formData.location_lat}
                              readOnly
                              placeholder="Auto-filled"
                              className="text-sm bg-muted/50 cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="location_lng" className="text-xs">Longitude</Label>
                            <Input
                              id="location_lng"
                              name="location_lng"
                              value={formData.location_lng}
                              readOnly
                              placeholder="Auto-filled"
                              className="text-sm bg-muted/50 cursor-not-allowed"
                            />
                          </div>
                        </div>
                        {hasLocationCoordinates && Number.isFinite(locationLat) && Number.isFinite(locationLng) && (
                          <div className="space-y-1">
                            <Label className="text-xs">Map Preview</Label>
                            <div className="overflow-hidden rounded border border-gray-200 dark:border-gray-700">
                              <LocationMapPreview lat={locationLat} lng={locationLng} radiusKm={0} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Company Info (requesters only) */}
                    {profile?.role === "requester" && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            Company Information
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="company_name" className="text-xs">Company Name</Label>
                              <Input
                                id="company_name"
                                name="company_name"
                                value={formData.company_name}
                                onChange={handleChange}
                                placeholder="Your company name"
                                className="text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="company_website" className="text-xs">
                                <Globe className="w-3 h-3 inline mr-1" />
                                Website
                              </Label>
                              <Input
                                id="company_website"
                                name="company_website"
                                type="url"
                                value={formData.company_website}
                                onChange={handleChange}
                                placeholder="https://www.example.com"
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex justify-end">
                      <Button type="submit" disabled={contactLoading} size="sm" className="h-8 text-xs px-3">
                        {contactLoading ? (
                          <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Saving...</>
                        ) : (
                          <><Save className="w-3.5 h-3.5 mr-1" />Save</>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <ConfirmationDialog
        open={showDeleteAvatarConfirm}
        onOpenChange={setShowDeleteAvatarConfirm}
        title="Remove avatar?"
        description="Your profile image will be removed and your initials will be shown instead."
        confirmText="Remove"
        cancelText="Keep Avatar"
        confirmTone="danger"
        onConfirm={confirmDeleteAvatar}
      />
    </>
  );
}
