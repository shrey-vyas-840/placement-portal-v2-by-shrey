import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface RecruiterContact {
  contact_id?: string;

  contact_name: string;

  contact_email: string;

  contact_number: string;

  contact_position: string;

  primary_contact: boolean;

  isNew?: boolean;

  markedForDelete?: boolean;
}

interface CompanyManagementEditorProps {
  companyName: string;
  setCompanyName: React.Dispatch<React.SetStateAction<string>>;

  website: string;
  setWebsite: React.Dispatch<React.SetStateAction<string>>;

  industry: string;
  setIndustry: React.Dispatch<React.SetStateAction<string>>;

  location: string;
  setLocation: React.Dispatch<React.SetStateAction<string>>;

  companySize: string;
  setCompanySize: React.Dispatch<React.SetStateAction<string>>;

  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;

  recruiters: RecruiterContact[];

  setRecruiters: React.Dispatch<React.SetStateAction<RecruiterContact[]>>;

  onSave: () => void;
}

export function CompanyManagementEditor({
  companyName,
  setCompanyName,
  website,
  setWebsite,
  industry,
  setIndustry,
  location,
  setLocation,
  companySize,
  setCompanySize,
  description,
  setDescription,

  recruiters,
  setRecruiters,

  onSave,
}: CompanyManagementEditorProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Company Name</Label>

              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Company Website</Label>

              <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Industry</Label>

              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Hiring Location</Label>

              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Company Size</Label>

              <Input value={companySize} onChange={(e) => setCompanySize(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Company Description</Label>

            <Textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end border-t px-6 py-4">
            <Button onClick={onSave}>Save Company Information</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recruiter Contacts</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {recruiters.map((recruiter, index) => (
            <div key={recruiter.contact_id ?? index} className="rounded-xl border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Recruiter {index + 1}</div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={recruiter.primary_contact}
                      onChange={() => {
                        setRecruiters((previous) =>
                          previous.map((item, itemIndex) => ({
                            ...item,
                            primary_contact: itemIndex === index,
                          })),
                        );
                      }}
                    />
                    Primary
                  </label>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setRecruiters((previous) =>
                        previous.filter((_, itemIndex) => itemIndex !== index),
                      );
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recruiter Name</Label>

                  <Input
                    value={recruiter.contact_name}
                    onChange={(event) => {
                      const value = event.target.value;

                      setRecruiters((previous) =>
                        previous.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                contact_name: value,
                              }
                            : item,
                        ),
                      );
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Position</Label>

                  <Input
                    value={recruiter.contact_position}
                    onChange={(event) => {
                      const value = event.target.value;

                      setRecruiters((previous) =>
                        previous.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                contact_position: value,
                              }
                            : item,
                        ),
                      );
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>

                  <Input
                    value={recruiter.contact_email}
                    onChange={(event) => {
                      const value = event.target.value;

                      setRecruiters((previous) =>
                        previous.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                contact_email: value,
                              }
                            : item,
                        ),
                      );
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contact Number</Label>

                  <Input
                    value={recruiter.contact_number}
                    onChange={(event) => {
                      const value = event.target.value;

                      setRecruiters((previous) =>
                        previous.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                contact_number: value,
                              }
                            : item,
                        ),
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setRecruiters((previous) => [
                  ...previous,

                  {
                    contact_name: "",

                    contact_email: "",

                    contact_number: "",

                    contact_position: "",

                    primary_contact: previous.length === 0,

                    isNew: true,
                  },
                ]);
              }}
            >
              + Add Recruiter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
