import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CompanyManagementEditor() {
    return (
        <div className="space-y-6">

            <Card>

                <CardHeader>

                    <CardTitle>

                        Company Information

                    </CardTitle>

                </CardHeader>

                <CardContent className="space-y-6">

                    <div className="grid grid-cols-2 gap-6">

                        <div className="space-y-2">

                            <Label>

                                Company Name

                            </Label>

                            <Input />

                        </div>

                        <div className="space-y-2">

                            <Label>

                                Company Website

                            </Label>

                            <Input />

                        </div>

                        <div className="space-y-2">

                            <Label>

                                Industry

                            </Label>

                            <Input />

                        </div>

                        <div className="space-y-2">

                            <Label>

                                Hiring Location

                            </Label>

                            <Input />

                        </div>

                        <div className="space-y-2">

                            <Label>

                                Company Size

                            </Label>

                            <Input />

                        </div>

                    </div>

                    <div className="space-y-2">

                        <Label>

                            Company Description

                        </Label>

                        <Textarea
                            rows={5}
                        />

                    </div>

                </CardContent>

            </Card>

            <Card>

                <CardHeader>

                    <CardTitle>

                        Recruiter Contacts

                    </CardTitle>

                </CardHeader>

                <CardContent>

                    Recruiter management will be added next.

                </CardContent>

            </Card>

        </div>
    );
}