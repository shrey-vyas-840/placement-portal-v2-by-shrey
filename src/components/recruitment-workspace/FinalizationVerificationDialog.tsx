import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Trophy, Users, XCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  FinalizationPreparationResult,
  FinalizationSelectedCandidate,
} from "@/services/recruitment/recruitmentExecutionFinalizationEngine";

export type PlacementType =
  | "On Campus Placement"
  | "On Campus Internship"
  | "On Campus Internship + PPO"
  | "Off Campus Placement"
  | "Off Campus Internship"
  | "Off Campus Internship + PPO";

export interface CandidatePlacementConfiguration {
  studentId: string;

  placementType: PlacementType;

  packageLpa: number;

  placementNotes: string;
}

export interface FinalizationVerificationResult {
  notes: string;

  placements: CandidatePlacementConfiguration[];
}

interface FinalizationVerificationDialogProps {
  open: boolean;

  loading?: boolean;

  preparation: FinalizationPreparationResult | null;

  onCancel: () => void;

  onConfirm: (result: FinalizationVerificationResult) => Promise<void> | void;
}

const DEFAULT_PLACEMENT_TYPE: PlacementType = "On Campus Internship + PPO";

const DEFAULT_PACKAGE = 4.0;

export default function FinalizationVerificationDialog({
  open,
  loading = false,
  preparation,
  onCancel,
  onConfirm,
}: FinalizationVerificationDialogProps) {
  const [notes, setNotes] = useState("");

  const [placements, setPlacements] = useState<Record<string, CandidatePlacementConfiguration>>({});

  useEffect(() => {
    if (!open || !preparation) {
      return;
    }

    const next: Record<string, CandidatePlacementConfiguration> = {};

    for (const candidate of preparation.selectedCandidates) {
      next[candidate.studentId] = {
        studentId: candidate.studentId,

        placementType: DEFAULT_PLACEMENT_TYPE,

        packageLpa: candidate.packageLpa ?? DEFAULT_PACKAGE,

        placementNotes: "",
      };
    }

    setPlacements(next);
    setNotes("");
  }, [open, preparation]);

  const selectedCandidates = useMemo(() => preparation?.selectedCandidates ?? [], [preparation]);

  const blockers = preparation?.blockers ?? [];

  const statistics = preparation?.statistics;

  const canFinalize = preparation?.canFinalize ?? false;

  const totalSelected = selectedCandidates.length;

  const [defaultPlacementType, setDefaultPlacementType] =
    useState<PlacementType>(DEFAULT_PLACEMENT_TYPE);

  const [defaultPackage, setDefaultPackage] = useState<number>(DEFAULT_PACKAGE);

  const placementRows = useMemo(
    () =>
      selectedCandidates.map((candidate) => ({
        candidate,
        configuration: placements[candidate.studentId],
      })),
    [placements, selectedCandidates],
  );

  const updatePlacementType = (studentId: string, placementType: PlacementType) => {
    setPlacements((previous) => ({
      ...previous,
      [studentId]: {
        ...previous[studentId],
        placementType,
      },
    }));
  };

  const updatePackage = (studentId: string, packageLpa: number) => {
    setPlacements((previous) => ({
      ...previous,
      [studentId]: {
        ...previous[studentId],
        packageLpa,
      },
    }));
  };

  const updatePlacementNotes = (studentId: string, placementNotes: string) => {
    setPlacements((previous) => ({
      ...previous,
      [studentId]: {
        ...previous[studentId],
        placementNotes,
      },
    }));
  };

  const applyPlacementTypeToAll = (placementType: PlacementType) => {
    setPlacements((previous) => {
      const next = { ...previous };

      Object.keys(next).forEach((studentId) => {
        next[studentId] = {
          ...next[studentId],
          placementType,
        };
      });

      return next;
    });
  };

  const applyPackageToAll = (packageLpa: number) => {
    setPlacements((previous) => {
      const next = { ...previous };

      Object.keys(next).forEach((studentId) => {
        next[studentId] = {
          ...next[studentId],
          packageLpa,
        };
      });

      return next;
    });
  };

  const submit = async () => {
    if (!preparation || !canFinalize) {
      return;
    }

    await onConfirm({
      notes,
      placements: Object.values(placements),
    });
  };

  if (!preparation) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !loading) {
          onCancel();
        }
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            Final Recruitment Verification
          </DialogTitle>

          <DialogDescription>
            Review the execution summary before permanently finalizing this recruitment. Once
            finalized, placement records will be published and the execution will become read-only.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 px-6 py-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Selected</p>

                    <p className="mt-1 text-2xl font-bold">
                      {statistics?.selectedParticipants ?? 0}
                    </p>
                  </div>

                  <Trophy className="h-8 w-8 text-green-600" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">No Progress</p>

                    <p className="mt-1 text-2xl font-bold">
                      {statistics?.noProgressParticipants ?? 0}
                    </p>
                  </div>

                  <XCircle className="h-8 w-8 text-slate-500" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Pending</p>

                    <p className="mt-1 text-2xl font-bold">
                      {statistics?.pendingParticipants ?? 0}
                    </p>
                  </div>

                  <Users className="h-8 w-8 text-amber-600" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Blocking Issues</p>

                    <p className="mt-1 text-2xl font-bold">{statistics?.blockingIssues ?? 0}</p>
                  </div>

                  {canFinalize ? (
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-amber-600" />
                  )}
                </CardContent>
              </Card>
            </div>

            {blockers.length > 0 && (
              <Card className="border-destructive/30">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center gap-2 font-semibold text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Final Save is currently blocked
                  </div>

                  <div className="space-y-2">
                    {blockers.map((blocker) => (
                      <div
                        key={`${blocker.code}-${blocker.executionParticipantId ?? ""}-${blocker.executionRoundId ?? ""}`}
                        className="rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                      >
                        <div className="font-medium">{blocker.title}</div>

                        <div className="mt-1 text-sm text-muted-foreground">
                          {blocker.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            <div className="space-y-4">
              <div>
                <Card>
                  <CardContent className="space-y-5 p-5">
                    <div className="text-lg font-semibold">Default Placement Details</div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Placement Type</Label>

                        <Select
                          value={defaultPlacementType}
                          onValueChange={(value) => setDefaultPlacementType(value as PlacementType)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="On Campus Placement">On Campus Placement</SelectItem>

                            <SelectItem value="On Campus Internship">
                              On Campus Internship
                            </SelectItem>

                            <SelectItem value="On Campus Internship + PPO">
                              On Campus Internship + PPO
                            </SelectItem>

                            <SelectItem value="Off Campus Placement">
                              Off Campus Placement
                            </SelectItem>

                            <SelectItem value="Off Campus Internship">
                              Off Campus Internship
                            </SelectItem>

                            <SelectItem value="Off Campus Internship + PPO">
                              Off Campus Internship + PPO
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="secondary"
                          onClick={() => applyPlacementTypeToAll(defaultPlacementType)}
                        >
                          Apply Placement Type to All
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Package (LPA)</Label>

                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={defaultPackage}
                          onChange={(event) => setDefaultPackage(Number(event.target.value))}
                        />

                        <Button
                          variant="secondary"
                          onClick={() => applyPackageToAll(defaultPackage)}
                        >
                          Apply Package to All
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <h3 className="text-lg font-semibold">Selected Candidates</h3>

                <p className="text-sm text-muted-foreground">
                  Verify every selected candidate before final placement is published.
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left">Enrollment</th>

                      <th className="px-4 py-3 text-left">Student</th>

                      <th className="px-4 py-3 text-left">Role</th>

                      <th className="px-4 py-3 text-left">Stage</th>

                      <th className="px-4 py-3 text-left">Placement Type</th>

                      <th className="px-4 py-3 text-left">Package (LPA)</th>

                      <th className="px-4 py-3 text-left">Placement Notes</th>
                    </tr>
                  </thead>

                  <tbody>
                    {placementRows.map(({ candidate, configuration }) => (
                      <tr key={candidate.studentId} className="border-t">
                        <td className="px-4 py-3">{candidate.enrollmentNumber}</td>

                        <td className="px-4 py-3">
                          <div className="font-medium">{candidate.studentName}</div>

                          <div className="text-xs text-muted-foreground">
                            {candidate.companyName}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <Badge variant="secondary">{candidate.branchName}</Badge>
                        </td>

                        <td className="px-4 py-3">{candidate.selectedStageName}</td>

                        <td className="px-4 py-3">
                          <Select
                            value={configuration?.placementType ?? DEFAULT_PLACEMENT_TYPE}
                            onValueChange={(value) =>
                              updatePlacementType(candidate.studentId, value as PlacementType)
                            }
                          >
                            <SelectTrigger className="w-64">
                              <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="On Campus Placement">
                                On Campus Placement
                              </SelectItem>

                              <SelectItem value="On Campus Internship">
                                On Campus Internship
                              </SelectItem>

                              <SelectItem value="On Campus Internship + PPO">
                                On Campus Internship + PPO
                              </SelectItem>

                              <SelectItem value="Off Campus Placement">
                                Off Campus Placement
                              </SelectItem>

                              <SelectItem value="Off Campus Internship">
                                Off Campus Internship
                              </SelectItem>

                              <SelectItem value="Off Campus Internship + PPO">
                                Off Campus Internship + PPO
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={configuration?.packageLpa ?? DEFAULT_PACKAGE}
                            onChange={(event) =>
                              updatePackage(candidate.studentId, Number(event.target.value))
                            }
                          />
                        </td>

                        <td className="px-4 py-3">
                          <Input
                            value={configuration?.placementNotes ?? ""}
                            placeholder="Optional"
                            onChange={(event) =>
                              updatePlacementNotes(candidate.studentId, event.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Finalization Notes</Label>

              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                placeholder="Optional notes about this recruitment execution..."
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>

          <Button onClick={submit} disabled={!canFinalize || loading}>
            Final Save
            {totalSelected > 0 && ` (${totalSelected})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
