"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  updateProfile,
  uploadAvatar,
  deleteAvatar,
} from "@/lib/services/profileService";
import {
  resizeImage,
  validateImageFile,
  getOptimalImageFormat,
} from "@/lib/utils/imageUtils";
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
import PhoneTwoFactorAuth from "@/components/dashboard/shared/PhoneTwoFactorAuth";
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

const TABS: {
  id: TabId;
  label: string;
  desc: string;
  icon: React.ElementType;
}[] = [
  {
    id: "profile",
    label: "My Profile",
    desc: "Avatar & bio",
    icon: UserCircle,
  },
  {
    id: "security",
    label: "Password & Security",
    desc: "Change your password",
    icon: Lock,
  },
  {
    id: "contact",
    label: "Contact Info",
    desc: "Name, phone & address",
    icon: Contact,
  },
];

export default function AccountSettings() {
  const {
    user,
    profile,
    loading: authLoading,
    refreshProfile,
    signOut,
  } = useAuth();
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
  const locationLat = hasLocationCoordinates
    ? parseFloat(formData.location_lat)
    : NaN;
  const locationLng = hasLocationCoordinates
    ? parseFloat(formData.location_lng)
    : NaN;

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        location_address: profile.location?.address || "",
        location_city: profile.location?.city || "",
        location_country: profile.location?.country || "",
        location_lat:
          profile.location?.lat != null ? String(profile.location.lat) : "",
        location_lng:
          profile.location?.lng != null ? String(profile.location.lng) : "",
        company_name: profile.company_name || "",
        company_website: profile.company_website || "",
      });
    }
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
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
          lat: formData.location_lat
            ? parseFloat(formData.location_lat)
            : undefined,
          lng: formData.location_lng
            ? parseFloat(formData.location_lng)
            : undefined,
        },
        company_name: formData.company_name || null,
        company_website: formData.company_website || null,
      };
      if (
        !formData.location_address &&
        !formData.location_city &&
        !formData.location_country
      ) {
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
      const verifyRes = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: supabaseKey },
          body: JSON.stringify({
            email: user.email,
            password: passwordData.current_password,
          }),
        },
      );
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
        throw new Error(
          err?.msg || err?.message || "Failed to update password",
        );
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
    const TIER_COLORS: Record<string, string> = {
      bronze: "bg-amber-600",
      silver: "bg-gray-400",
      gold: "bg-yellow-500",
      platinum: "bg-purple-500",
    };
    const key = (tier || "bronze").toLowerCase();
    const label =
      (tier || "Bronze").charAt(0).toUpperCase() +
      (tier || "bronze").slice(1).toLowerCase();
    return (
      <Badge
        className={`${TIER_COLORS[key] || "bg-amber-600"} text-white border-0 text-xs px-2 py-0.5 gap-1`}
      >
        <Shield className="w-3 h-3 shrink-0" />
        {label}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const ROLE_COLORS: Record<string, string> = {
      requester: "bg-blue-500",
      collector: "bg-green-500",
      agent: "bg-purple-500",
      admin: "bg-red-500",
    };
    const key = (role || "requester").toLowerCase();
    const label =
      (role || "Requester").charAt(0).toUpperCase() +
      (role || "requester").slice(1).toLowerCase();
    return (
      <Badge
        className={`${ROLE_COLORS[key] || "bg-gray-500"} text-white border-0 text-xs px-2 py-0.5`}
      >
        {label}
      </Badge>
    );
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || "U";
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading account...</p>
        </div>
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

      <div className="p-1 sm:p-2 space-y-4 sm:space-y-6">
        <div className="pt-1 sm:pt-2 mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Account Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage your profile, security, and contact information
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 items-stretch">
          {/* ── Left Sidebar ── */}
          <aside className="w-full lg:w-72 shrink-0 order-1">
            <Card className="overflow-hidden border-none bg-white dark:bg-gray-800/50 shadow-sm h-fit">
              <CardHeader className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
                {/* Avatar + user info */}
                <div className="flex flex-col sm:flex-row sm:items-center items-center gap-2.5 sm:gap-4 text-center sm:text-left">
                  <div className="relative shrink-0">
                    <Avatar className="w-11 h-11 sm:w-16 sm:h-16 ring-1 ring-border/60">
                      <AvatarImage
                        src={profile?.avatar_url || "/default-avatar.svg"}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-sm sm:text-base bg-primary/90 text-primary-foreground font-medium">
                        {getInitials(
                          profile?.full_name || null,
                          profile?.email || "",
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {/* <button
                      type="button"
                      onClick={handleAvatarClick}
                      disabled={uploadingAvatar}
                      className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-md hover:bg-muted hover:scale-105 transition-all duration-200"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                      ) : (
                        <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button> */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {profile?.full_name || "No name set"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-[14rem] sm:max-w-full sm:w-40 mx-auto sm:mx-0">
                      {profile?.email}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center sm:justify-start mt-2">
                      {profile?.role && getRoleBadge(profile.role)}
                      {profile &&
                        getVerificationBadge(profile.verification_tier)}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-4 sm:px-5 pt-0 pb-4 sm:pb-5">
                {/* Tab nav - vertical on desktop */}
                <div className="hidden lg:block">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Settings
                  </p>
                  <nav className="flex flex-col gap-0.5" role="tablist">
                    {TABS.map(({ id, label, desc, icon: Icon }) => (
                      <button
                        key={id}
                        role="tab"
                        aria-selected={activeTab === id}
                        onClick={() => setActiveTab(id)}
                        className={cn(
                          "group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200",
                          activeTab === id
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-foreground",
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            activeTab === id
                              ? "bg-primary/15"
                              : "bg-gray-100 dark:bg-gray-800/50 group-hover:bg-gray-100 dark:group-hover:bg-gray-800/50",
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-none">
                            {label}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Horizontal tabs - mobile */}
                <div className="lg:hidden grid grid-cols-3 gap-1 p-1 rounded-lg bg-muted/40">
                  {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={cn(
                        "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2 rounded-md text-[11px] sm:text-sm font-medium transition-all min-w-0",
                        activeTab === id
                          ? "bg-background text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate max-w-full">
                        {id === "profile"
                          ? "Profile"
                          : id === "security"
                            ? "Security"
                            : "Contact"}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Account info footer */}
                <div className="hidden lg:block mt-5 pt-5 border-t border-border/50 dark:border-gray-700/50 space-y-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Account Info
                  </p>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Joined{" "}
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString(
                            "en-US",
                            { month: "short", year: "numeric" },
                          )
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 shrink-0" />
                    <span className="capitalize">
                      {profile?.verification_tier || "Bronze"} tier
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Right – Tab Content */}
          <div className="flex-1 min-w-0 order-2">
            {/* ── MY PROFILE ── */}
            {activeTab === "profile" && (
              <Card className="border-none bg-white dark:bg-gray-800/50 shadow-sm overflow-hidden">
                <CardHeader className="py-4 sm:py-5 px-4 sm:px-6 border-b border-border/50">
                  <CardTitle className="text-base font-semibold">
                    My Profile
                  </CardTitle>
                  <CardDescription className="text-sm mt-0.5">
                    Update your profile photo and bio
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 sm:space-y-6 py-5 sm:py-6 px-4 sm:px-6">
                  {/* Photo section */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-5 p-4 sm:p-5 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-border/50 dark:border-gray-700/50">
                    <Avatar className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 ring-1 ring-border/60">
                      <AvatarImage
                        src={profile?.avatar_url || "/default-avatar.svg"}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-sm sm:text-base bg-cyan-500 text-white">
                        {getInitials(
                          profile?.full_name || null,
                          profile?.email || "",
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 flex-1 min-w-0 text-center sm:text-left">
                      <p className="text-sm font-medium">Profile Photo</p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG or WebP · Max 5 MB
                      </p>
                      <div className="flex w-full flex-col sm:flex-row gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleAvatarClick}
                          disabled={uploadingAvatar}
                          className="text-xs h-8 sm:h-7 px-3 gap-1.5 bg-gray-100 dark:bg-gray-800/50 border border-border/50 dark:border-gray-700/50 w-full sm:w-auto"
                        >
                          {uploadingAvatar ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          {profile?.avatar_url
                            ? "Change Photo"
                            : "Upload Photo"}
                        </Button>
                        {profile?.avatar_url && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleDeleteAvatar}
                            disabled={uploadingAvatar}
                            className="text-xs h-8 sm:h-7 px-3 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 w-full sm:w-auto"
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

                  <Separator className="my-6" />

                  {/* Bio */}
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    {profileError && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        <span className="shrink-0">!</span>
                        {profileError}
                      </div>
                    )}
                    {profileSuccess && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 dark:bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        Profile saved successfully!
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-sm font-medium">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell us a bit about yourself..."
                        rows={4}
                        className="text-sm min-h-[100px] resize-none bg-gray-100 dark:bg-gray-800/50 border border-border/50 dark:border-gray-700/50"
                      />
                    </div>

                    {/* Collector Stats */}
                    {profile?.role === "collector" && (
                      <>
                        <Separator className="my-6" />
                        <div>
                          <h3 className="text-sm font-semibold mb-3">
                            Collector Stats
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              {
                                label: "Earnings",
                                value: `$${profile.total_earnings?.toFixed(2) || "0.00"}`,
                              },
                              {
                                label: "Submissions",
                                value: profile.total_submissions || 0,
                              },
                              {
                                label: "Completed",
                                value: profile.completed_tasks || 0,
                              },
                              {
                                label: "Rating",
                                value: `${profile.rating?.toFixed(1) || "0.0"}`,
                              },
                            ].map((stat) => (
                              <div
                                key={stat.label}
                                className="p-4 rounded-lg bg-muted/50 dark:bg-muted/30 border border-border/50 text-center"
                              >
                                <p className="text-base font-bold text-primary">
                                  {stat.value}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {stat.label}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={profileLoading}
                        size="sm"
                        className="h-9 px-4 gap-2 w-full sm:w-auto"
                      >
                        {profileLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* ── PASSWORD & SECURITY ── */}
            {activeTab === "security" && (
              <Card className="border-none bg-white dark:bg-gray-800/50 shadow-sm overflow-hidden">
                <CardHeader className="py-4 sm:py-5 px-4 sm:px-6 border-b border-border/50">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password &amp; Security
                  </CardTitle>
                  <CardDescription className="text-sm mt-0.5">
                    Update your account password and enable 2FA
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-5 sm:py-6 px-4 sm:px-6">
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {passwordError && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        <span className="shrink-0">!</span>
                        {passwordError}
                      </div>
                    )}

                    {/* Account info row */}
                    <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-border/50 dark:border-gray-700/50 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-border/50 dark:border-gray-700/50 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Signed in as
                        </p>
                        <p className="text-sm font-medium">{profile?.email}</p>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-2">
                      <Label
                        htmlFor="current_password"
                        className="text-sm font-medium"
                      >
                        Current Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="current_password"
                          name="current_password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.current_password}
                          onChange={handlePasswordChange}
                          placeholder="Enter current password"
                          className="text-sm pr-9 bg-gray-100 dark:bg-gray-800/50 border border-border/50 dark:border-gray-700/50"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-9 w-9 p-0"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="new_password"
                          className="text-sm font-medium"
                        >
                          New Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="new_password"
                            name="new_password"
                            type={showNewPassword ? "text" : "password"}
                            value={passwordData.new_password}
                            onChange={handlePasswordChange}
                            placeholder="At least 6 characters"
                            className="text-sm pr-9 bg-gray-100 dark:bg-gray-800/50 border border-border/50 dark:border-gray-700/50"
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

                      <div className="space-y-2">
                        <Label
                          htmlFor="confirm_password"
                          className="text-sm font-medium"
                        >
                          Confirm New Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirm_password"
                            name="confirm_password"
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordData.confirm_password}
                            onChange={handlePasswordChange}
                            placeholder="Re-enter new password"
                            className="text-sm pr-9 bg-gray-100 dark:bg-gray-800/50 border border-border/50 dark:border-gray-700/50"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-9 w-9 p-0"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
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

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={passwordLoading}
                        size="sm"
                        className="h-9 px-4 gap-2 w-full sm:w-auto"
                      >
                        {passwordLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            Change password
                          </>
                        )}
                      </Button>
                    </div>
                  </form>

                  <Separator className="my-6" />
                  <PhoneTwoFactorAuth defaultPhone={profile?.phone || ""} />
                </CardContent>
              </Card>
            )}

            {/* ── CONTACT INFO ── */}
            {activeTab === "contact" && (
              <Card className="border-none bg-white dark:bg-gray-800/50 shadow-sm overflow-hidden">
                <CardHeader className="py-4 sm:py-5 px-4 sm:px-6 border-b border-border/50">
                  <CardTitle className="text-base font-semibold">
                    Contact Info
                  </CardTitle>
                  <CardDescription className="text-sm mt-0.5">
                    Update your name, phone, and address
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-5 sm:py-6 px-4 sm:px-6">
                  <form onSubmit={handleContactSubmit} className="space-y-5">
                    {contactError && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        <span className="shrink-0">!</span>
                        {contactError}
                      </div>
                    )}
                    {contactSuccess && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        Contact info saved successfully!
                      </div>
                    )}

                    {/* Name + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="full_name"
                          className="text-sm font-medium"
                        >
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
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">
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

                    <Separator className="my-6" />

                    {/* Address */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Address
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="location_address"
                            className="text-sm font-medium"
                          >
                            Street Address
                          </Label>
                          <AddressAutocomplete
                            value={formData.location_address}
                            onChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                location_address: value,
                              }))
                            }
                            onSelect={(result) => {
                              setFormData((prev) => ({
                                ...prev,
                                location_address: result.address,
                                location_city:
                                  result.city || prev.location_city,
                                location_country:
                                  result.country || prev.location_country,
                                location_lat:
                                  result.lat != null
                                    ? String(result.lat)
                                    : prev.location_lat,
                                location_lng:
                                  result.lng != null
                                    ? String(result.lng)
                                    : prev.location_lng,
                              }));
                            }}
                            placeholder="Start typing to search..."
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="location_city"
                              className="text-sm font-medium"
                            >
                              City
                            </Label>
                            <Input
                              id="location_city"
                              name="location_city"
                              value={formData.location_city}
                              readOnly
                              placeholder="Auto-filled from address"
                              className="text-sm bg-muted/50 cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="location_country"
                              className="text-sm font-medium"
                            >
                              Country
                            </Label>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="location_lat"
                              className="text-sm font-medium"
                            >
                              Latitude
                            </Label>
                            <Input
                              id="location_lat"
                              name="location_lat"
                              value={formData.location_lat}
                              readOnly
                              placeholder="Auto-filled"
                              className="text-sm bg-muted/50 cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="location_lng"
                              className="text-sm font-medium"
                            >
                              Longitude
                            </Label>
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
                        {hasLocationCoordinates &&
                          Number.isFinite(locationLat) &&
                          Number.isFinite(locationLng) && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Map Preview
                              </Label>
                              <div className="overflow-hidden rounded-lg border border-border">
                                <LocationMapPreview
                                  lat={locationLat}
                                  lng={locationLng}
                                  radiusKm={0}
                                />
                              </div>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Company Info (requesters only) */}
                    {profile?.role === "requester" && (
                      <>
                        <Separator className="my-6" />
                        <div>
                          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Company Information
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor="company_name"
                                className="text-sm font-medium"
                              >
                                Company Name
                              </Label>
                              <Input
                                id="company_name"
                                name="company_name"
                                value={formData.company_name}
                                onChange={handleChange}
                                placeholder="Your company name"
                                className="text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="company_website"
                                className="text-sm font-medium"
                              >
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

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={contactLoading}
                        size="sm"
                        className="h-9 px-4 gap-2 w-full sm:w-auto"
                      >
                        {contactLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save changes
                          </>
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
