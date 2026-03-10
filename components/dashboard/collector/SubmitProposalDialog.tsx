"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createProposal } from "@/lib/services/proposalService";
import type { Project, CreateProposalInput } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, DollarSign, Loader2, Send } from "lucide-react";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";

interface SubmitProposalDialogProps {
  project: Project;
  onSuccess?: () => void;
  triggerClassName?: string;
}

export default function SubmitProposalDialog({
  project,
  onSuccess,
  triggerClassName = "",
}: SubmitProposalDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    address: "",
    city: "",
    country: "",
    lat: null as number | null,
    lng: null as number | null,
    data_types: [] as string[],
    equipment: [] as string[],
    experience_years: "",
    languages: [] as string[],
    availability: "",
    notes: "",
    proposed_budget: "",
    message: "",
  });

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

  const equipmentOptions = [
    "Camera",
    "Video Camera",
    "Microphone",
    "GPS Device",
    "Smartphone",
    "Tablet",
    "Drone",
    "Sensor Equipment",
  ];

  const languageOptions = [
    "English",
    "Spanish",
    "French",
    "German",
    "Chinese",
    "Japanese",
    "Arabic",
    "Portuguese",
  ];

  const handleCheckboxChange = (
    field: "data_types" | "equipment" | "languages",
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!user) {
      setError("You must be logged in to submit a proposal");
      setLoading(false);
      return;
    }

    if (!formData.address || !formData.city || !formData.country) {
      setError("Please search and select a location");
      setLoading(false);
      return;
    }

    if (formData.data_types.length === 0) {
      setError("Please select at least one data type you can collect");
      setLoading(false);
      return;
    }

    try {
      const proposalData: CreateProposalInput = {
        request_id: project.id,
        location: {
          address: formData.address,
          lat: formData.lat,
          lng: formData.lng,
          city: formData.city,
          country: formData.country,
        },
        capabilities: {
          data_types: formData.data_types,
          equipment:
            formData.equipment.length > 0 ? formData.equipment : undefined,
          experience_years: formData.experience_years
            ? parseInt(formData.experience_years)
            : undefined,
          languages:
            formData.languages.length > 0 ? formData.languages : undefined,
          availability: formData.availability || undefined,
          notes: formData.notes || undefined,
        },
        proposed_budget: formData.proposed_budget
          ? parseFloat(formData.proposed_budget)
          : null,
        message: formData.message || null,
      };

      const { data, error: createError } = await createProposal(
        user.id,
        proposalData,
      );

      if (createError) {
        throw createError;
      }

      setOpen(false);
      setFormData({
        address: "",
        city: "",
        country: "",
        lat: null,
        lng: null,
        data_types: [],
        equipment: [],
        experience_years: "",
        languages: [],
        availability: "",
        notes: "",
        proposed_budget: "",
        message: "",
      });
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to submit proposal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={`bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-xl ${triggerClassName}`}
        >
          Submit Proposal
          <Send className="w-4 h-4 ml-2" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Proposal for {project.title}</DialogTitle>
          <DialogDescription>
            Provide your location, capabilities, and availability to apply for
            this project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Location */}
          <div className="space-y-2">
            <Label>
              <MapPin className="w-4 h-4 inline mr-1" />
              Location *
            </Label>
            <AddressAutocomplete
              value={formData.address}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, address: value }))
              }
              onSelect={(result) =>
                setFormData((prev) => ({
                  ...prev,
                  address: result.address,
                  city: result.city,
                  country: result.country,
                  lat: result.lat ?? null,
                  lng: result.lng ?? null,
                }))
              }
              placeholder="Search for your location..."
              disabled={loading}
            />
            {formData.city && formData.country && (
              <p className="text-xs text-muted-foreground">
                {formData.city}, {formData.country}
                {formData.lat && formData.lng && (
                  <span className="ml-2 text-cyan-500">
                    ({formData.lat.toFixed(4)}, {formData.lng.toFixed(4)})
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Data Types */}
          <div className="space-y-2">
            <Label>Data Types You Can Collect *</Label>
            <div className="grid grid-cols-4 gap-2">
              {dataTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded border hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Checkbox
                    checked={formData.data_types.includes(type)}
                    onCheckedChange={() =>
                      handleCheckboxChange("data_types", type)
                    }
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div className="space-y-2">
            <Label>Equipment Available</Label>
            <div className="grid grid-cols-4 gap-2">
              {equipmentOptions.map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded border hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Checkbox
                    checked={formData.equipment.includes(item)}
                    onCheckedChange={() =>
                      handleCheckboxChange("equipment", item)
                    }
                  />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Experience & Languages */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Years of Experience</Label>
              <Input
                type="number"
                min="0"
                value={formData.experience_years}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    experience_years: e.target.value,
                  }))
                }
                placeholder="e.g., 3"
              />
            </div>
            <div className="space-y-2">
              <Label>Languages</Label>
              <Select
                value={formData.languages.join(",")}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    languages: value ? value.split(",") : [],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select languages" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <Label>Availability</Label>
            <Select
              value={formData.availability}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, availability: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="weekends">Weekends only</SelectItem>
                <SelectItem value="flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Proposed Budget */}
          <div className="space-y-2">
            <Label>
              <DollarSign className="w-4 h-4 inline mr-1" />
              Proposed Budget (Optional)
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.proposed_budget}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  proposed_budget: e.target.value,
                }))
              }
              placeholder="Leave empty to accept project budget"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Any additional information about your capabilities..."
              rows={3}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Message to Requester (Optional)</Label>
            <Textarea
              value={formData.message}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, message: e.target.value }))
              }
              placeholder="Add a personal message..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Proposal
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
