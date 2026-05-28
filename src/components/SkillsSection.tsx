import { useEffect, useState } from "react";
import { toast } from "sonner";

import { skillService } from "@/services/skillService";

interface SkillsSectionProps {
    studentId: string;
    onCompletionChange?: (
        completed: boolean,
    ) => void;
}

const defaultFormData = {
    technical_skills: "",
    programming_languages: "",
    tools_and_technologies: "",

    github_url: "",
    linkedin_url: "",
    portfolio_url: "",

    strengths: "",
};

export default function SkillsSection({
    studentId,
    onCompletionChange,
}: SkillsSectionProps) {
    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [editMode, setEditMode] =
        useState(false);

    const [hasExistingData, setHasExistingData] =
        useState(false);

    const [formData, setFormData] =
        useState(defaultFormData);

    useEffect(() => {
        loadSkills();
    }, [studentId]);

    const loadSkills = async () => {
        try {
            setLoading(true);

            const data =
                await skillService.getSkillProfile(
                    studentId,
                );

            if (data) {
                setHasExistingData(true);

                setFormData({
                    technical_skills:
                        data.technical_skills || "",

                    programming_languages:
                        data.programming_languages ||
                        "",

                    tools_and_technologies:
                        data.tools_and_technologies ||
                        "",

                    github_url:
                        data.github_url || "",

                    linkedin_url:
                        data.linkedin_url || "",

                    portfolio_url:
                        data.portfolio_url || "",

                    strengths:
                        data.strengths || "",
                });

                const completed =
                    !!data.technical_skills &&
                    !!data.programming_languages &&
                    !!data.linkedin_url;

                onCompletionChange?.(
                    completed,
                );

                setEditMode(false);
            } else {
                setEditMode(true);
                setHasExistingData(false);
            }
        } catch (error: any) {
            console.error(
                "SKILLS LOAD ERROR:",
                error,
            );

            toast.error(
                "Failed to load skills",
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        e: any,
    ) => {
        setFormData({
            ...formData,
            [e.target.name]:
                e.target.value,
        });
    };

    const validateUrls = () => {
        const validUrl = (
            url: string,
        ) => {
            if (!url) return true;

            return (
                url.startsWith(
                    "http://",
                ) ||
                url.startsWith(
                    "https://",
                )
            );
        };

        if (
            !validUrl(
                formData.github_url,
            )
        ) {
            toast.error(
                "GitHub URL must start with https://",
            );

            return false;
        }

        if (
            !validUrl(
                formData.linkedin_url,
            )
        ) {
            toast.error(
                "LinkedIn URL must start with https://",
            );

            return false;
        }

        if (
            !validUrl(
                formData.portfolio_url,
            )
        ) {
            toast.error(
                "Portfolio URL must start with https://",
            );

            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateUrls()) {
            return;
        }

        try {
            setSaving(true);

            await skillService.saveSkillProfile(
                {
                    student_id: studentId,

                    technical_skills:
                        formData.technical_skills?.trim() ||
                        null,

                    programming_languages:
                        formData.programming_languages?.trim() ||
                        null,

                    tools_and_technologies:
                        formData.tools_and_technologies?.trim() ||
                        null,

                    github_url:
                        formData.github_url?.trim() ||
                        null,

                    linkedin_url:
                        formData.linkedin_url?.trim() ||
                        null,

                    portfolio_url:
                        formData.portfolio_url?.trim() ||
                        null,

                    strengths:
                        formData.strengths?.trim() ||
                        null,

                    certification_count: 0,
                    hackathon_count: 0,
                    project_count: 0,
                    profile_score: 0,

                    created_by_type:
                        "User",

                    is_active: true,
                }
            );

            const completed =
                !!formData.technical_skills &&
                !!formData.programming_languages &&
                !!formData.linkedin_url;

            onCompletionChange?.(
                completed,
            );

            setHasExistingData(true);

            setEditMode(false);

            toast.success(
                "Skills updated successfully",
            );
        } catch (error: any) {
            console.error(
                "SKILLS SAVE ERROR:",
                error,
            );

            toast.error(
                error.message ||
                "Failed to save skills",
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4">
                Loading skills...
            </div>
        );
    }

    return (
        <div className="border rounded-xl p-6 space-y-6 bg-white mt-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                    Skills
                </h2>

                <div className="flex gap-2">
                    {!hasExistingData ? (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 border rounded-lg"
                        >
                            {saving
                                ? "Saving..."
                                : "Save"}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    setEditMode(true);
                                }}
                                className="px-4 py-2 border rounded-lg"
                            >
                                Edit
                            </button>

                            {editMode && (
                                <>
                                    <button
                                        onClick={() => {
                                            loadSkills();
                                        }}
                                        className="px-4 py-2 border rounded-lg"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-4 py-2 border rounded-lg"
                                    >
                                        {saving
                                            ? "Saving..."
                                            : "Save"}
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-5">
                <div>
                    <label className="text-sm font-medium block mb-2">
                        Technical Skills
                    </label>

                    <textarea
                        name="technical_skills"
                        placeholder="Example: React, Node.js, SQL"
                        value={
                            formData.technical_skills
                        }
                        onChange={handleChange}
                        disabled={!editMode}
                        className="w-full border rounded-lg p-3"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium block mb-2">
                        Programming Languages
                    </label>

                    <textarea
                        name="programming_languages"
                        placeholder="Example: Java, Python, C++"
                        value={
                            formData.programming_languages
                        }
                        onChange={handleChange}
                        disabled={!editMode}
                        className="w-full border rounded-lg p-3"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium block mb-2">
                        Tools & Technologies
                    </label>

                    <textarea
                        name="tools_and_technologies"
                        placeholder="Example: Git, Docker, Firebase"
                        value={
                            formData.tools_and_technologies
                        }
                        onChange={handleChange}
                        disabled={!editMode}
                        className="w-full border rounded-lg p-3"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium block mb-2">
                        GitHub URL
                    </label>

                    <input
                        type="text"
                        name="github_url"
                        placeholder="https://github.com/username"
                        value={
                            formData.github_url
                        }
                        onChange={handleChange}
                        disabled={!editMode}
                        className="w-full border rounded-lg p-3"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium block mb-2">
                        LinkedIn URL
                    </label>

                    <input
                        type="text"
                        name="linkedin_url"
                        placeholder="https://linkedin.com/in/username"
                        value={
                            formData.linkedin_url
                        }
                        onChange={handleChange}
                        disabled={!editMode}
                        className="w-full border rounded-lg p-3"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium block mb-2">
                        Portfolio URL
                    </label>

                    <input
                        type="text"
                        name="portfolio_url"
                        placeholder="https://yourportfolio.com"
                        value={
                            formData.portfolio_url
                        }
                        onChange={handleChange}
                        disabled={!editMode}
                        className="w-full border rounded-lg p-3"
                    />
                </div>

                <div>
                    <label className="text-sm font-medium block mb-2">
                        Strengths
                    </label>

                    <textarea
                        name="strengths"
                        placeholder="Example: Leadership, Communication, Problem Solving"
                        value={formData.strengths}
                        onChange={handleChange}
                        disabled={!editMode}
                        className="w-full border rounded-lg p-3"
                    />
                </div>
            </div>
        </div>
    );
}
