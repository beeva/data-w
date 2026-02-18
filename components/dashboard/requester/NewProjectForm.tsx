"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/services/projectService";
import { useAuth } from "@/contexts/AuthContext";
import type { ProjectFormData } from "@/types/project";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, DollarSign, Calendar, Users, FileText } from "lucide-react";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import DataSuggestionsPanel from "./DataSuggestionsPanel";

export default function NewProjectForm() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
    category: "",
    budget: "",
    deadline: "",
    max_collectors: "1",
    data_types: [],
    formats: [],
    specifications: "",
    location_address: "",
    location_lat: "",
    location_lng: "",
    radius_km: "",
  });

  const categories = [
    "Photography",
    "Video",
    "Audio",
    "Text",
    "Survey",
    "Location Data",
    "Sensor Data",
    "Other",
  ];

  const dataTypes = [
    "Images",
    "Videos",
    "Audio Files",
    "Text Documents",
    "Spreadsheets",
    "GPS Coordinates",
    "Sensor Readings",
    "Other",
  ];

  const formats = [
    "JPEG",
    "PNG",
    "MP4",
    "PDF",
    "CSV",
    "JSON",
    "XML",
    "Other",
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (
    name: "data_types" | "formats",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter((item) => item !== value)
        : [...prev[name], value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!user || !profile) {
      setError("You must be logged in to create a project");
      setLoading(false);
      return;
    }

    if (profile.role !== "requester" && profile.role !== "admin") {
      setError("Only requesters can create projects");
      setLoading(false);
      return;
    }

    try {
      const requirements = {
        data_types: formData.data_types,
        formats: formData.formats,
        specifications: formData.specifications,
      };

      const location = formData.location_address
        ? {
            address: formData.location_address,
            lat: formData.location_lat ? parseFloat(formData.location_lat) : null,
            lng: formData.location_lng ? parseFloat(formData.location_lng) : null,
            radius_km: formData.radius_km
              ? parseFloat(formData.radius_km)
              : null,
          }
        : null;

      const { data, error: createError } = await createProject(user.id, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budget: parseFloat(formData.budget),
        deadline: formData.deadline,
        max_collectors: parseInt(formData.max_collectors),
        location,
        requirements,
      });

      if (createError) {
        throw createError;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/projects/active");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="dark:bg-gray-800/50 border-none">
        <CardContent className="py-4 px-3">
          <div className="text-center py-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Project Created!</h3>
            <p className="text-[10px] text-muted-foreground">Redirecting...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)] p-2">
      {/* Main Form - 70% */}
      <div className="flex-1 min-w-0">
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          <Card className="dark:bg-gray-800/50 border-none h-full flex flex-col">
            <CardHeader className="py-2 px-3 flex-shrink-0">
              <CardTitle className="text-base font-semibold">Create New Project</CardTitle>
              <CardDescription className="text-[10px]">Fill in project details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 py-1.5 px-3 flex-1 overflow-y-auto">
          {error && (
            <div className="p-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-[10px]">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-0.5">
            <Label htmlFor="title" className="text-[10px]">Project Title *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Collect Street Sign Images"
              required
              className="h-7 text-[11px]"
            />
          </div>

          {/* Description */}
          <div className="space-y-0.5">
            <Label htmlFor="description" className="text-[10px]">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what data you need..."
              rows={2}
              required
              className="text-[11px] min-h-[50px]"
            />
          </div>

          {/* Category */}
          <div className="space-y-0.5">
            <Label htmlFor="category" className="text-[10px]">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleSelectChange("category", value)}
              required
            >
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-[11px]">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget and Deadline */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <Label htmlFor="budget" className="text-[10px]">
                <DollarSign className="w-2.5 h-2.5 inline mr-0.5" />
                Budget ($) *
              </Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                step="0.01"
                min="0"
                value={formData.budget}
                onChange={handleChange}
                placeholder="0.00"
                required
                className="h-7 text-[11px]"
              />
            </div>

            <div className="space-y-0.5">
              <Label htmlFor="deadline" className="text-[10px]">
                <Calendar className="w-2.5 h-2.5 inline mr-0.5" />
                Deadline *
              </Label>
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
          </div>

          {/* Max Collectors */}
          <div className="space-y-0.5">
            <Label htmlFor="max_collectors" className="text-[10px]">
              <Users className="w-2.5 h-2.5 inline mr-0.5" />
              Max Collectors
            </Label>
            <Input
              id="max_collectors"
              name="max_collectors"
              type="number"
              min="1"
              value={formData.max_collectors}
              onChange={handleChange}
              required
              className="h-7 text-[11px]"
            />
          </div>

          {/* Data Types */}
          <div className="space-y-0.5">
            <Label className="text-[10px]">Data Types *</Label>
            <div className="grid grid-cols-4 gap-1">
              {dataTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-1 cursor-pointer p-1 rounded border hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={formData.data_types.includes(type)}
                    onChange={() => handleCheckboxChange("data_types", type)}
                    className="rounded w-3 h-3"
                  />
                  <span className="text-[10px]">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Formats */}
          <div className="space-y-0.5">
            <Label className="text-[10px]">Formats *</Label>
            <div className="grid grid-cols-4 gap-1">
              {formats.map((format) => (
                <label
                  key={format}
                  className="flex items-center gap-1 cursor-pointer p-1 rounded border hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={formData.formats.includes(format)}
                    onChange={() => handleCheckboxChange("formats", format)}
                    className="rounded w-3 h-3"
                  />
                  <span className="text-[10px]">{format}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Specifications */}
          <div className="space-y-0.5">
            <Label htmlFor="specifications" className="text-[10px]">Additional Specs</Label>
            <Textarea
              id="specifications"
              name="specifications"
              value={formData.specifications}
              onChange={handleChange}
              placeholder="Any additional requirements..."
              rows={2}
              className="text-[11px] min-h-[40px]"
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5 p-2 border border-gray-200 dark:border-gray-700 rounded">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <Label className="text-[10px] font-semibold">Location (Optional)</Label>
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

            </CardContent>
            {/* Submit Button - Sticky at bottom */}
            <div className="flex gap-2 p-3 pt-1.5 border-t border-gray-700 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                size="sm"
                className="h-6 text-[10px] px-3"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} size="sm" className="flex-1 h-6 text-[10px]">
                {loading ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </Card>
        </form>
      </div>

      {/* Suggestions Panel - 30% */}
      <div className="w-[30%] min-w-[300px]">
        <DataSuggestionsPanel
          title={formData.title}
          description={formData.description}
          onBudgetSelect={(budget) => {
            setFormData((prev) => ({ ...prev, budget: budget.toFixed(2) }));
          }}
        />
      </div>
    </div>
  );
}
