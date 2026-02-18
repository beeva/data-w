"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateProject } from "@/lib/services/projectService";
import type { Project, ProjectCategory } from "@/types/project";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, MapPin } from "lucide-react";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";

interface EditProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CATEGORIES: ProjectCategory[] = [
  "Photography",
  "Video",
  "Audio",
  "Text",
  "Survey",
  "Location Data",
  "Sensor Data",
  "Other",
];

const DATA_TYPES = [
  "Image",
  "Video",
  "Audio",
  "Document",
  "GPS Location",
  "Sensor Reading",
  "Survey Response",
  "Other",
];

const FORMATS = [
  "JPEG",
  "PNG",
  "WebP",
  "MP4",
  "MOV",
  "MP3",
  "WAV",
  "PDF",
  "CSV",
  "JSON",
  "Other",
];

export default function EditProjectDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
}: EditProjectDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    deadline: "",
    max_collectors: "",
    data_types: [] as string[],
    formats: [] as string[],
    specifications: "",
    location_address: "",
    location_lat: "",
    location_lng: "",
    radius_km: "",
  });

  // Initialize form with project data
  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || "",
        description: project.description || "",
        category: project.category || "",
        budget: project.budget?.toString() || "",
        deadline: project.deadline
          ? new Date(project.deadline).toISOString().split("T")[0]
          : "",
        max_collectors: project.max_collectors?.toString() || "",
        data_types: project.requirements?.data_types || [],
        formats: project.requirements?.formats || [],
        specifications: project.requirements?.specifications || "",
        location_address: project.location?.address || "",
        location_lat: project.location?.lat?.toString() || "",
        location_lng: project.location?.lng?.toString() || "",
        radius_km: project.location?.radius_km?.toString() || "",
      });
    }
  }, [project]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleMultiSelect = (name: "data_types" | "formats", value: string) => {
    setFormData((prev) => {
      const current = prev[name];
      if (current.includes(value)) {
        return { ...prev, [name]: current.filter((v) => v !== value) };
      }
      return { ...prev, [name]: [...current, value] };
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project) return;

    // Validation
    if (!formData.title.trim()) {
      setError("Project title is required");
      return;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return;
    }
    if (!formData.category) {
      setError("Please select a category");
      return;
    }
    const budget = parseFloat(formData.budget);
    if (isNaN(budget) || budget <= 0) {
      setError("Please enter a valid budget");
      return;
    }
    if (!formData.deadline) {
      setError("Deadline is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const updates = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        budget: budget,
        deadline: formData.deadline,
        max_collectors: parseInt(formData.max_collectors) || 1,
        requirements: {
          data_types: formData.data_types,
          formats: formData.formats,
          specifications: formData.specifications.trim() || undefined,
        },
        location: formData.location_address
          ? {
              address: formData.location_address,
              lat: formData.location_lat ? parseFloat(formData.location_lat) : null,
              lng: formData.location_lng ? parseFloat(formData.location_lng) : null,
              radius_km: formData.radius_km
                ? parseFloat(formData.radius_km)
                : null,
            }
          : null,
      };

      const { error: updateError } = await updateProject(
        project.id,
        user.id,
        updates
      );

      if (updateError) {
        throw updateError;
      }

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Failed to update project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto dark:bg-gray-800 p-3">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-sm font-semibold">Edit Project</DialogTitle>
          <DialogDescription className="text-[10px]">Update project information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2">
          {error && (
            <div className="p-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-[10px]">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-1.5">
            <div className="space-y-0.5">
              <Label htmlFor="title" className="text-[10px]">Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter project title"
                className="h-7 text-[11px]"
              />
            </div>

            <div className="space-y-0.5">
              <Label htmlFor="description" className="text-[10px]">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your project..."
                rows={2}
                required
                className="text-[11px] min-h-[40px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <Label htmlFor="category" className="text-[10px]">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger className="h-7 text-[11px]">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-[11px]">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-0.5">
                <Label htmlFor="budget" className="text-[10px]">Budget ($) *</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="h-7 text-[11px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <Label htmlFor="deadline" className="text-[10px]">Deadline *</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleChange}
                  required
                  className="h-7 text-[11px]"
                />
              </div>

              <div className="space-y-0.5">
                <Label htmlFor="max_collectors" className="text-[10px]">Max Collectors</Label>
                <Input
                  id="max_collectors"
                  name="max_collectors"
                  type="number"
                  min="1"
                  value={formData.max_collectors}
                  onChange={handleChange}
                  placeholder="1"
                  className="h-7 text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-[10px] font-semibold">Requirements</h3>

            <div className="space-y-0.5">
              <Label className="text-[10px]">Data Types</Label>
              <div className="flex flex-wrap gap-1">
                {DATA_TYPES.map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={formData.data_types.includes(type) ? "default" : "outline"}
                    size="sm"
                    className="h-5 text-[9px] px-1.5"
                    onClick={() => handleMultiSelect("data_types", type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-0.5">
              <Label className="text-[10px]">Formats</Label>
              <div className="flex flex-wrap gap-1">
                {FORMATS.map((format) => (
                  <Button
                    key={format}
                    type="button"
                    variant={formData.formats.includes(format) ? "default" : "outline"}
                    size="sm"
                    className="h-5 text-[9px] px-1.5"
                    onClick={() => handleMultiSelect("formats", format)}
                  >
                    {format}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-0.5">
              <Label htmlFor="specifications" className="text-[10px]">Specifications</Label>
              <Textarea
                id="specifications"
                name="specifications"
                value={formData.specifications}
                onChange={handleChange}
                placeholder="Additional requirements..."
                rows={2}
                className="text-[11px] min-h-[40px]"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <h3 className="text-[10px] font-semibold">Location (Optional)</h3>
            </div>

            <div className="space-y-0.5">
              <Label htmlFor="location_address" className="text-[10px]">Address</Label>
              <AddressAutocomplete
                value={formData.location_address}
                onChange={(value: string) =>
                  setFormData((prev) => ({ ...prev, location_address: value }))
                }
                onSelect={(result: { address: string; city: string; country: string; lat?: number; lng?: number }) =>
                  setFormData((prev) => ({
                    ...prev,
                    location_address: result.address,
                    location_lat: result.lat?.toString() || "",
                    location_lng: result.lng?.toString() || "",
                  }))
                }
                placeholder="Search for a location..."
                className="h-7 text-[11px]"
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <div className="space-y-0.5">
                <Label htmlFor="location_lat" className="text-[10px]">Latitude</Label>
                <Input
                  id="location_lat"
                  name="location_lat"
                  value={formData.location_lat}
                  readOnly
                  placeholder="Auto-filled"
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
                  placeholder="Auto-filled"
                  className="h-7 text-[11px] bg-muted/50 cursor-not-allowed"
                />
              </div>

              <div className="space-y-0.5">
                <Label htmlFor="radius_km" className="text-[10px]">Radius (km)</Label>
                <Input
                  id="radius_km"
                  name="radius_km"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.radius_km}
                  onChange={handleChange}
                  placeholder="5.0"
                  className="h-7 text-[11px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              size="sm"
              className="h-6 text-[10px] px-3"
            >
              Cancel
            </Button>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
