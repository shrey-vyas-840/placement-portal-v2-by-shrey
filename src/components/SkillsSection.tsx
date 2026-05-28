import { useEffect, useState } from "react";
import { toast } from "sonner";
import CreatableSelect from "react-select/creatable";
import { skillService } from "@/services/skillService";

type SkillOption = {
    label: string;
    value: string;
};

interface SkillsSectionProps {
    studentId: string;
    onCompletionChange?: (
        completed: boolean,
    ) => void;
}

const defaultFormData = {
    technical_skills:
        [] as SkillOption[],

    programming_languages:
        [] as SkillOption[],

    tools_and_technologies:
        [] as SkillOption[],

    github_url: "",
    linkedin_url: "",
    portfolio_url: "",

    strengths: "",
};

const technicalSkillOptions = [
    "React",
    "Node.js",
    "Express.js",
    "MongoDB",
    "PostgreSQL",
    "Supabase",
    "Firebase",
    "Docker",
    "AWS",
    "Machine Learning",
    "AI",
    "UI/UX",
    "Git",
    "GitHub",
].map((skill) => ({
    label: skill,
    value: skill,
}));

const languageOptions = [
    "C",
    "C++",
    "Java",
    "Python",
    "JavaScript",
    "TypeScript",
].map((skill) => ({
    label: skill,
    value: skill,
}));

const toolsOptions = [
    "VS Code",
    "Figma",
    "Git",
    "GitHub",
    "Postman",
    "Docker",
    "Linux",
].map((skill) => ({
    label: skill,
    value: skill,
}));

export default function SkillsSection({
    studentId,
    onCompletionChange,
}: SkillsSectionProps) {
    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [hasExistingData, setHasExistingData] =
        useState(false);

    const [initialData, setInitialData] =
        useState("");

    const [editMode, setEditMode] =
        useState(false);

    const [formData, setFormData] =
        useState(defaultFormData);

    const [errors, setErrors] =

        useState({
            github_url: "",
            linkedin_url: "",
            portfolio_url: "",
        });

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
                setEditMode(false);

                setFormData({
                    technical_skills: Array.isArray(
                        data.technical_skills,
                    )
                        ? data.technical_skills
                        : data.technical_skills
                            ? data.technical_skills
                                .split(",")
                                .filter(Boolean)
                                .map(
                                    (
                                        skill: string,
                                    ) => ({
                                        label:
                                            skill.trim(),
                                        value:
                                            skill.trim(),
                                    }),
                                )
                            : [],

                    programming_languages:
                        Array.isArray(
                            data.programming_languages,
                        )
                            ? data.programming_languages
                            : data.programming_languages
                                ? data.programming_languages
                                    .split(",")
                                    .filter(Boolean)
                                    .map(
                                        (
                                            skill: string,
                                        ) => ({
                                            label:
                                                skill.trim(),
                                            value:
                                                skill.trim(),
                                        }),
                                    )
                                : [],

                    tools_and_technologies:
                        Array.isArray(
                            data.tools_and_technologies,
                        )
                            ? data.tools_and_technologies
                            : data.tools_and_technologies
                                ? data.tools_and_technologies
                                    .split(",")
                                    .filter(Boolean)
                                    .map(
                                        (
                                            skill: string,
                                        ) => ({
                                            label:
                                                skill.trim(),
                                            value:
                                                skill.trim(),
                                        }),
                                    )
                                : [],

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
        const {
            name,
            value,
        } = e.target;

        setFormData({
            ...formData,
            [name]: value,
        });

        if (name === "github_url") {
            const valid =
                /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9_-]+\/?$/.test(
                    value,
                ) || value === "";

            setErrors((prev) => ({
                ...prev,
                github_url: valid
                    ? ""
                    : "Only valid GitHub profile links allowed",
            }));
        }

        if (name === "linkedin_url") {
            const valid =
                /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?$/.test(
                    value,
                ) || value === "";

            setErrors((prev) => ({
                ...prev,
                linkedin_url: valid
                    ? ""
                    : "Only valid LinkedIn profile links allowed",
            }));
        }

        if (name === "portfolio_url") {
            const valid =
                /^https:\/\/.+\.(vercel\.app|netlify\.app|github\.io)(\/.*)?$/.test(
                    value,
                ) || value === "";

            setErrors((prev) => ({
                ...prev,
                portfolio_url: valid
                    ? ""
                    : "Only Vercel / Netlify / GitHub Pages links allowed",
            }));
        }
    };

    const generateComparableData = () => {
        return JSON.stringify({
            technical_skills:
                formData.technical_skills
                    .map(
                        (item) =>
                            item.value,
                    )
                    .sort(),

            programming_languages:
                formData.programming_languages
                    .map(
                        (item) =>
                            item.value,
                    )
                    .sort(),

            tools_and_technologies:
                formData.tools_and_technologies
                    .map(
                        (item) =>
                            item.value,
                    )
                    .sort(),

            github_url:
                formData.github_url.trim(),

            linkedin_url:
                formData.linkedin_url.trim(),

            portfolio_url:
                formData.portfolio_url.trim(),

            strengths:
                formData.strengths.trim(),
        });
    };

    const handleSave = async () => {

        const currentData = generateComparableData();

        if (
            errors.github_url ||
            errors.linkedin_url ||
            errors.portfolio_url
        ) {
            toast.error(
                "Please fix invalid links before saving",
            );

            return;
        }

        if (
            currentData === initialData
        ) {
            toast.info(
                "No changes detected",
            );

            return;
        }

        try {

            setSaving(true);

            await skillService.saveSkillProfile(
                {
                    student_id: studentId,

                    technical_skills:
                        formData.technical_skills
                            .map(
                                (item: any) =>
                                    item.value,
                            )
                            .join(", "),

                    programming_languages:
                        formData.programming_languages
                            .map(
                                (item: any) =>
                                    item.value,
                            )
                            .join(", "),

                    tools_and_technologies:
                        formData.tools_and_technologies
                            .map(
                                (item: any) =>
                                    item.value,
                            )
                            .join(", "),

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
                !!formData.technical_skills.length &&
                !!formData.programming_languages.length &&
                !!formData.linkedin_url;

            onCompletionChange?.(
                completed,
            );

            setInitialData(
                generateComparableData(),
            );

            setHasExistingData(true);

            setEditMode(false);

            toast.success(
                "Skills updated successfully",
            );

            await loadSkills();

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

    const currentData =
        generateComparableData()
        
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
                            {!editMode ? (
                                <button
                                    onClick={() => {
                                        setEditMode(true);
                                    }}
                                    className="px-4 py-2 border rounded-lg"
                                >
                                    Edit
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={async () => {
                                            await loadSkills();

                                            setEditMode(false);
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

            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium">
                        Technical Skills
                    </label>

                    <CreatableSelect<
                        SkillOption,
                        true
                    >
                        isMulti
                        isDisabled={!editMode}
                        options={technicalSkillOptions}

                        value={
                            Array.isArray(
                                formData.technical_skills,
                            )
                                ? formData.technical_skills
                                : []
                        }
                        onChange={(value) =>
                            setFormData({
                                ...formData,
                                technical_skills: [
                                    ...value,
                                ],
                            })
                        }
                    />
                </div>

                <div>
                    <label className="text-sm font-medium">
                        Programming Languages
                    </label>

                    <CreatableSelect<
                        SkillOption,
                        true
                    >
                        isMulti
                        isDisabled={!editMode}
                        options={languageOptions}

                        value={
                            Array.isArray(
                                formData.programming_languages,
                            )
                                ? formData.programming_languages
                                : []
                        }
                        onChange={(value) =>
                            setFormData({
                                ...formData,
                                programming_languages:
                                    [...value],
                            })
                        }
                    />
                </div>

                <div>
                    <label className="text-sm font-medium">
                        Tools & Technologies
                    </label>

                    <CreatableSelect<
                        SkillOption,
                        true
                    >
                        isMulti
                        isDisabled={!editMode}
                        options={toolsOptions}

                        value={
                            Array.isArray(
                                formData.tools_and_technologies,
                            )
                                ? formData.tools_and_technologies
                                : []
                        }

                        onChange={(value) =>
                            setFormData({
                                ...formData,
                                tools_and_technologies:
                                    [...value],
                            })
                        }
                    />
                </div>

                <div>
                    <label className="text-sm font-medium">
                        GitHub URL
                    </label>

                    <input
                        disabled={!editMode}
                        type="text"
                        name="github_url"
                        placeholder="GitHub URL"
                        value={
                            formData.github_url
                        }
                        onChange={handleChange}
                        className="w-full border rounded-lg p-3"
                    />

                    {errors.github_url && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.github_url}
                        </p>
                    )}

                </div>

                <div>
                    <label className="text-sm font-medium">
                        LinkedIn URL
                    </label>

                    <input
                        disabled={!editMode}
                        type="text"
                        name="linkedin_url"
                        placeholder="LinkedIn URL"
                        value={
                            formData.linkedin_url
                        }
                        onChange={handleChange}
                        className="w-full border rounded-lg p-3"
                    />

                    {errors.linkedin_url && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.linkedin_url}
                        </p>
                    )}

                </div>

                <div>
                    <label className="text-sm font-medium">
                        Portfolio URL
                    </label>

                    <input
                        disabled={!editMode}
                        type="text"
                        name="portfolio_url"
                        placeholder="Portfolio URL"
                        value={
                            formData.portfolio_url
                        }
                        onChange={handleChange}
                        className="w-full border rounded-lg p-3"
                    />
                    {errors.portfolio_url && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.portfolio_url}
                        </p>
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium">
                        Strengths
                    </label>

                    <textarea
                        disabled={!editMode}
                        name="strengths"
                        placeholder="Strengths"
                        value={
                            formData.strengths
                        }
                        onChange={handleChange}
                        className="w-full border rounded-lg p-3"
                    />
                </div>
            </div>
        </div >
    );
}
