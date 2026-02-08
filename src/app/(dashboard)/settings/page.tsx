"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Palette,
  Key,
  Building,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from "lucide-react";

export default function SettingsPage() {
  const [canvaConnected, setCanvaConnected] = useState(false);
  const [connectingCanva, setConnectingCanva] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    licenseNumber: "",
  });
  const [saving, setSaving] = useState(false);

  const connectCanva = async () => {
    setConnectingCanva(true);
    try {
      const res = await fetch("/api/canva/auth");
      if (res.ok) {
        const data = await res.json();
        window.open(data.authUrl, "_blank");
      }
    } catch {
      // Handle error
    } finally {
      setConnectingCanva(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    // TODO: Save profile to database
    setTimeout(() => setSaving(false), 1000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and integrations
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Your agent information for CMA reports
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                placeholder="jane@realty.com"
              />
            </div>
            <div>
              <Label htmlFor="company">Brokerage / Company</Label>
              <Input
                id="company"
                value={profile.company}
                onChange={(e) =>
                  setProfile({ ...profile, company: e.target.value })
                }
                placeholder="Keller Williams Realty"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="license">License Number</Label>
              <Input
                id="license"
                value={profile.licenseNumber}
                onChange={(e) =>
                  setProfile({ ...profile, licenseNumber: e.target.value })
                }
                placeholder="DRE# 01234567"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Canva Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-purple-500" />
            <div>
              <CardTitle>Canva Integration</CardTitle>
              <CardDescription>
                Connect your Canva account to create branded CMA designs
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {canvaConnected ? (
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Canva account connected</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCanvaConnected(false)}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Connect your Canva account to use brand templates and create
                professionally designed CMA reports directly from this tool.
              </p>
              <Button onClick={connectCanva} disabled={connectingCanva}>
                {connectingCanva ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                {connectingCanva ? "Connecting..." : "Connect Canva Account"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-orange-500" />
            <div>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                MLS data source and API settings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium text-sm">Repliers API</p>
              <p className="text-xs text-muted-foreground">MLS property data</p>
            </div>
            <Badge variant="default">Connected</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium text-sm">Database</p>
              <p className="text-xs text-muted-foreground">MySQL local instance</p>
            </div>
            <Badge variant="default">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Default CMA Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building className="h-5 w-5 text-blue-500" />
            <div>
              <CardTitle>CMA Defaults</CardTitle>
              <CardDescription>
                Default settings for new CMA reports
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Default Search Radius</Label>
              <Input type="number" defaultValue="3" placeholder="3 miles" />
              <p className="text-xs text-muted-foreground mt-1">Miles from subject property</p>
            </div>
            <div>
              <Label>Sold Date Range (months)</Label>
              <Input type="number" defaultValue="6" placeholder="6 months" />
              <p className="text-xs text-muted-foreground mt-1">How far back to search for sold comps</p>
            </div>
            <div>
              <Label>Sqft Tolerance (%)</Label>
              <Input type="number" defaultValue="20" placeholder="20%" />
              <p className="text-xs text-muted-foreground mt-1">+/- percentage for square footage matching</p>
            </div>
            <div>
              <Label>Max Comparables</Label>
              <Input type="number" defaultValue="6" placeholder="6" />
              <p className="text-xs text-muted-foreground mt-1">Maximum comps to include in report</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline">Save Defaults</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
