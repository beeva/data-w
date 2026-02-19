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
import ToastNotification from "@/components/ui/toast-notification";
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
} from "lucide-react";

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

export default function AccountSettings() {
  const { user, profile, loading: authLoading, refreshProfile, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
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

  // Initialize form with profile data when available
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const updates: Partial<UserProfile> = {
        full_name: formData.full_name || null,
        phone: formData.phone || null,
        bio: formData.bio || null,
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

      // Remove empty location object
      if (
        !formData.location_address &&
        !formData.location_city &&
        !formData.location_country
      ) {
        updates.location = null;
      }

      const { error: updateError } = await updateProfile(user.id, updates);

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      await refreshProfile();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    const validation = validateImageFile(file, 5);
    if (!validation.isValid) {
      setError(validation.error || "Invalid image file");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setUploadingAvatar(true);
    setError("");
    setSuccess(false);

    try {
      // Get optimal format for browser
      const outputFormat = getOptimalImageFormat();
      
      // Resize and optimize image (256x256, square crop)
      const resizedFile = await resizeImage(file, {
        maxWidth: 256,
        maxHeight: 256,
        quality: 0.9,
        outputFormat,
      });

      // Upload the optimized image
      const { url, error: uploadError } = await uploadAvatar(user.id, resizedFile);

      if (uploadError) {
        throw uploadError;
      }

      setSuccess(true);
      // Refresh the page to show new avatar
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      setError(err.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user || !profile?.avatar_url) return;
    
    if (!confirm("Are you sure you want to delete your avatar?")) {
      return;
    }

    setUploadingAvatar(true);
    setError("");
    setSuccess(false);

    try {
      const { error: deleteError } = await deleteAvatar(user.id);

      if (deleteError) {
        throw deleteError;
      }

      setSuccess(true);
      // Refresh the page to show changes
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      setError(err.message || "Failed to delete avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordSuccess(false);
    setPasswordError("");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setPasswordError("");
    setPasswordSuccess(false);

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

      // Step 1: Verify current password via REST (no client side effects)
      const verifyRes = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: supabaseKey },
          body: JSON.stringify({
            email: user.email,
            password: passwordData.current_password,
          }),
        }
      );

      if (!verifyRes.ok) {
        throw new Error("Current password is incorrect");
      }

      const { access_token } = await verifyRes.json();

      // Step 2: Update password via REST using the token (no client side effects)
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
    {passwordToast && (
      <ToastNotification
        message="Password changed successfully. Signing out..."
        type="success"
        duration={2500}
        onClose={() => setPasswordToast(false)}
      />
    )}
    <div className="space-y-2 p-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">Account Settings</h1>
          <p className="text-[10px] text-muted-foreground">Manage your profile</p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card className="dark:bg-gray-800/50 border-none">
        <CardContent className="py-2 px-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-11 h-11">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="text-xs bg-cyan-500 text-white">
                  {getInitials(profile?.full_name || null, profile?.email || "")}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full p-0 shadow-sm"
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                ) : (
                  <Camera className="w-2.5 h-2.5" />
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs font-semibold truncate">
                  {profile?.full_name || "No name set"}
                </h2>
                {profile && getRoleBadge(profile.role)}
                {profile && getVerificationBadge(profile.verification_tier)}
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                <Mail className="w-2.5 h-2.5 flex-shrink-0" />
                {profile?.email}
              </p>
              <p className="text-[9px] text-muted-foreground">
                Since {formatDate(profile?.created_at || null)}
              </p>
            </div>
            
            <div className="flex gap-1 flex-shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="text-[9px] h-5 px-1.5"
              >
                <Upload className="w-2 h-2 mr-0.5" />
                {profile?.avatar_url ? "Change" : "Upload"}
              </Button>
              {profile?.avatar_url && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleDeleteAvatar}
                  disabled={uploadingAvatar}
                  className="text-[9px] h-5 px-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-2 h-2 mr-0.5" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <form onSubmit={handleSubmit}>
        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs font-semibold">Personal Information</CardTitle>
            <CardDescription className="text-[10px]">Update your details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 py-1.5 px-3">
            {error && (
              <div className="p-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-[10px]">
                {error}
              </div>
            )}

            {success && (
              <div className="p-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-600 dark:text-green-400 text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Updated!
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <Label htmlFor="full_name" className="text-[10px]">
                  <User className="w-2.5 h-2.5 inline mr-0.5" />
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="h-7 text-[11px]"
                />
              </div>

              <div className="space-y-0.5">
                <Label htmlFor="phone" className="text-[10px]">
                  <Phone className="w-2.5 h-2.5 inline mr-0.5" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="h-7 text-[11px]"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-0.5">
              <Label htmlFor="bio" className="text-[10px]">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us a bit about yourself..."
                rows={2}
                className="text-[11px] min-h-[50px]"
              />
            </div>

            <Separator className="my-1.5" />

            {/* Location */}
            <div>
              <h3 className="text-[10px] font-semibold mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Location
              </h3>
              <div className="space-y-1.5">
                <div className="space-y-0.5">
                  <Label htmlFor="location_address" className="text-[10px]">Address</Label>
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
                        location_city: result.city || prev.location_city,
                        location_country: result.country || prev.location_country,
                        location_lat: result.lat != null ? String(result.lat) : prev.location_lat,
                        location_lng: result.lng != null ? String(result.lng) : prev.location_lng,
                      }));
                      setSuccess(false);
                      setError("");
                    }}
                    placeholder="Start typing to search..."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="location_city" className="text-[10px]">City</Label>
                    <Input
                      id="location_city"
                      name="location_city"
                      value={formData.location_city}
                      readOnly
                      placeholder="Auto-filled from address"
                      className="h-7 text-[11px] bg-muted/50 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="location_country" className="text-[10px]">Country</Label>
                    <Input
                      id="location_country"
                      name="location_country"
                      value={formData.location_country}
                      readOnly
                      placeholder="Auto-filled from address"
                      className="h-7 text-[11px] bg-muted/50 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="location_lat" className="text-[10px]">Latitude</Label>
                    <Input
                      id="location_lat"
                      name="location_lat"
                      value={formData.location_lat}
                      readOnly
                      placeholder="Auto-filled from address"
                      className="h-7 text-[11px] bg-muted/50 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="location_lng" className="text-[10px]">Longitude</Label>
                    <Input
                      id="location_lng"
                      name="location_lng"
                      value={formData.location_lng}
                      readOnly
                      placeholder="Auto-filled from address"
                      className="h-7 text-[11px] bg-muted/50 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Company Info (for requesters) */}
            {profile?.role === "requester" && (
              <>
                <Separator className="my-1.5" />
                <div>
                  <h3 className="text-[10px] font-semibold mb-1.5 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Company Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="company_name" className="text-[10px]">Company Name</Label>
                      <Input
                        id="company_name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        placeholder="Your company name"
                        className="h-7 text-[11px]"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="company_website" className="text-[10px]">
                        <Globe className="w-2.5 h-2.5 inline mr-0.5" />
                        Website
                      </Label>
                      <Input
                        id="company_website"
                        name="company_website"
                        type="url"
                        value={formData.company_website}
                        onChange={handleChange}
                        placeholder="https://www.example.com"
                        className="h-7 text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Collector Stats (read-only) */}
            {profile?.role === "collector" && (
              <>
                <Separator className="my-1.5" />
                <div>
                  <h3 className="text-[10px] font-semibold mb-1">Collector Stats</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <div className="p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded text-center">
                      <p className="text-sm font-bold text-cyan-500">
                        ${profile.total_earnings?.toFixed(2) || "0.00"}
                      </p>
                      <p className="text-[9px] text-muted-foreground">Earnings</p>
                    </div>
                    <div className="p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded text-center">
                      <p className="text-sm font-bold text-cyan-500">
                        {profile.total_submissions || 0}
                      </p>
                      <p className="text-[9px] text-muted-foreground">Submissions</p>
                    </div>
                    <div className="p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded text-center">
                      <p className="text-sm font-bold text-cyan-500">
                        {profile.completed_tasks || 0}
                      </p>
                      <p className="text-[9px] text-muted-foreground">Completed</p>
                    </div>
                    <div className="p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded text-center">
                      <p className="text-sm font-bold text-cyan-500">
                        {profile.rating?.toFixed(1) || "0.0"}
                      </p>
                      <p className="text-[9px] text-muted-foreground">Rating</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Agent Stats (read-only) */}
            {profile?.role === "agent" && (
              <>
                <Separator className="my-1.5" />
                <div>
                  <h3 className="text-[10px] font-semibold mb-1">Validator Stats</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <div className="p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded text-center">
                      <p className="text-sm font-bold text-cyan-500">
                        {profile.total_validations || 0}
                      </p>
                      <p className="text-[9px] text-muted-foreground">Validations</p>
                    </div>
                    <div className="p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded text-center">
                      <p className="text-sm font-bold text-cyan-500">
                        {profile.validation_score?.toFixed(1) || "0.0"}%
                      </p>
                      <p className="text-[9px] text-muted-foreground">Score</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-1.5">
              <Button type="submit" disabled={loading} size="sm" className="h-6 text-[10px] px-3">
                {loading ? (
                  <>
                    <Loader2 className="w-2.5 h-2.5 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-2.5 h-2.5 mr-1" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Account Info (read-only) */}
      <Card className="dark:bg-gray-800/50 border-none">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-xs font-semibold">Account Information</CardTitle>
          <CardDescription className="text-[10px]">Read-only details</CardDescription>
        </CardHeader>
        <CardContent className="py-1.5 px-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <Label className="text-[9px] text-muted-foreground">Email</Label>
              <p className="text-[11px] font-medium truncate">{profile?.email || "N/A"}</p>
            </div>
            <div>
              <Label className="text-[9px] text-muted-foreground">Role</Label>
              <p className="text-[11px] font-medium capitalize">{profile?.role || "N/A"}</p>
            </div>
            <div>
              <Label className="text-[9px] text-muted-foreground">Tier</Label>
              <p className="text-[11px] font-medium capitalize">
                {profile?.verification_tier || "Bronze"}
              </p>
            </div>
            <div>
              <Label className="text-[9px] text-muted-foreground">Updated</Label>
              <p className="text-[11px] font-medium">
                {formatDate(profile?.updated_at || null)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <form onSubmit={handlePasswordSubmit}>
        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Change Password
            </CardTitle>
            <CardDescription className="text-[10px]">
              Update your account password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 py-1.5 px-3">
            {passwordError && (
              <div className="p-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-[10px]">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-600 dark:text-green-400 text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Password changed successfully!
              </div>
            )}

            <div className="space-y-0.5">
              <Label htmlFor="current_password" className="text-[10px]">
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
                  className="h-7 text-[11px] pr-8"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-7 w-7 p-0"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <Eye className="w-3 h-3 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <Label htmlFor="new_password" className="text-[10px]">
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
                    className="h-7 text-[11px] pr-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-7 w-7 p-0"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-3 h-3 text-muted-foreground" />
                    ) : (
                      <Eye className="w-3 h-3 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-0.5">
                <Label htmlFor="confirm_password" className="text-[10px]">
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
                    className="h-7 text-[11px] pr-8"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-7 w-7 p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-3 h-3 text-muted-foreground" />
                    ) : (
                      <Eye className="w-3 h-3 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1.5">
              <Button
                type="submit"
                disabled={passwordLoading}
                size="sm"
                className="h-6 text-[10px] px-3"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="w-2.5 h-2.5 mr-1 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock className="w-2.5 h-2.5 mr-1" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
    </>
  );
}
