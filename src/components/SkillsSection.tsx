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
  onCompletionChange?: (completed: boolean) => void;
}

const defaultFormData = {
  technical_skills: [] as SkillOption[],

  programming_languages: [] as SkillOption[],

  tools_and_technologies: [] as SkillOption[],

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

const languageOptions = ["C", "C++", "Java", "Python", "JavaScript", "TypeScript"].map((skill) => ({
  label: skill,
  value: skill,
}));

const toolsOptions = ["VS Code", "Figma", "Git", "GitHub", "Postman", "Docker", "Linux"].map(
  (skill) => ({
    label: skill,
    value: skill,
  }),
);

const selectStyles = {
  control: (base: any) => ({
    ...base,
    minHeight: 54,
    borderRadius: 16,
    borderColor: "#e2e8f0",
    boxShadow: "none",
    backgroundColor: "#f8fafc",
  }),

  multiValue: (base: any) => ({
    ...base,
    borderRadius: 999,
    padding: "2px 6px",
  }),
};

export default function SkillsSection({ studentId, onCompletionChange }: SkillsSectionProps) {
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [hasExistingData, setHasExistingData] = useState(false);

  const [initialData, setInitialData] = useState("");

  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState(defaultFormData);

  const [errors, setErrors] = useState({
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

      const data = await skillService.getSkillProfile(studentId);

      if (data) {
        setHasExistingData(true);
        setEditMode(false);

        setFormData({
          technical_skills: Array.isArray(data.technical_skills)
            ? data.technical_skills
            : data.technical_skills
              ? data.technical_skills
                  .split(",")
                  .filter(Boolean)
                  .map((skill: string) => ({
                    label: skill.trim(),
                    value: skill.trim(),
                  }))
              : [],

          programming_languages: Array.isArray(data.programming_languages)
            ? data.programming_languages
            : data.programming_languages
              ? data.programming_languages
                  .split(",")
                  .filter(Boolean)
                  .map((skill: string) => ({
                    label: skill.trim(),
                    value: skill.trim(),
                  }))
              : [],

          tools_and_technologies: Array.isArray(data.tools_and_technologies)
            ? data.tools_and_technologies
            : data.tools_and_technologies
              ? data.tools_and_technologies
                  .split(",")
                  .filter(Boolean)
                  .map((skill: string) => ({
                    label: skill.trim(),
                    value: skill.trim(),
                  }))
              : [],

          github_url: data.github_url || "",

          linkedin_url: data.linkedin_url || "",

          portfolio_url: data.portfolio_url || "",

          strengths: data.strengths || "",
        });

        const completed =
          !!data.technical_skills && !!data.programming_languages && !!data.linkedin_url;

        onCompletionChange?.(completed);

        setEditMode(false);
      } else {
        setEditMode(true);
        setHasExistingData(false);
      }
    } catch (error: any) {
      console.error("SKILLS LOAD ERROR:", error);

      toast.error("Failed to load skills");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === "github_url") {
      const valid =
        /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9_-]+\/?$/.test(value) || value === "";

      setErrors((prev) => ({
        ...prev,
        github_url: valid ? "" : "Only valid GitHub profile links allowed",
      }));
    }

    if (name === "linkedin_url") {
      const valid =
        /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?$/.test(value) || value === "";

      setErrors((prev) => ({
        ...prev,
        linkedin_url: valid ? "" : "Only valid LinkedIn profile links allowed",
      }));
    }

    if (name === "portfolio_url") {
      const valid =
        /^https:\/\/.+\.(vercel\.app|netlify\.app|github\.io)(\/.*)?$/.test(value) || value === "";

      setErrors((prev) => ({
        ...prev,
        portfolio_url: valid ? "" : "Only Vercel / Netlify / GitHub Pages links allowed",
      }));
    }
  };

  const generateComparableData = () => {
    return JSON.stringify({
      technical_skills: formData.technical_skills.map((item) => item.value).sort(),

      programming_languages: formData.programming_languages.map((item) => item.value).sort(),

      tools_and_technologies: formData.tools_and_technologies.map((item) => item.value).sort(),

      github_url: formData.github_url.trim(),

      linkedin_url: formData.linkedin_url.trim(),

      portfolio_url: formData.portfolio_url.trim(),

      strengths: formData.strengths.trim(),
    });
  };

  const handleSave = async () => {
    const currentData = generateComparableData();

    if (errors.github_url || errors.linkedin_url || errors.portfolio_url) {
      toast.error("Please fix invalid links before saving");

      return;
    }

    if (currentData === initialData) {
      toast.info("No changes detected");

      return;
    }

    try {
      setSaving(true);

      await skillService.saveSkillProfile({
        student_id: studentId,

        technical_skills: formData.technical_skills.map((item: any) => item.value).join(", "),

        programming_languages: formData.programming_languages
          .map((item: any) => item.value)
          .join(", "),

        tools_and_technologies: formData.tools_and_technologies
          .map((item: any) => item.value)
          .join(", "),

        github_url: formData.github_url?.trim() || null,

        linkedin_url: formData.linkedin_url?.trim() || null,

        portfolio_url: formData.portfolio_url?.trim() || null,

        strengths: formData.strengths?.trim() || null,

        certification_count: 0,
        hackathon_count: 0,
        project_count: 0,
        profile_score: 0,

        created_by_type: "User",

        is_active: true,
      });

      const completed =
        !!formData.technical_skills.length &&
        !!formData.programming_languages.length &&
        !!formData.linkedin_url;

      onCompletionChange?.(completed);

      setInitialData(generateComparableData());

      setHasExistingData(true);

      setEditMode(false);

      toast.success("Skills updated successfully");

      await loadSkills();
    } catch (error: any) {
      console.error("SKILLS SAVE ERROR:", error);

      toast.error(error.message || "Failed to save skills");
    } finally {
      setSaving(false);
    }
  };

  const currentData = generateComparableData();

  if (loading) {
    return <div className="p-4">Loading skills...</div>;
  }
  return (
    <div
      className="
            rounded-3xl
            border
            border-border/50
            bg-white
            p-8
            shadow-sm
        "
    >
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Skills & Professional Profile</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Showcase your technical expertise, programming capabilities and professional presence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!hasExistingData ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="
rounded-xl
bg-primary
px-6
py-3
font-medium
text-white
transition-all
hover:shadow-lg
"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          ) : (
            <>
              {!editMode ? (
                <button
                  onClick={() => {
                    setEditMode(true);
                  }}
                  className="
rounded-xl
bg-primary
px-6
py-3
font-medium
text-white
transition-all
hover:shadow-lg
"
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
                    className="
rounded-xl
border
border-slate-300
bg-white
px-6
py-3
font-medium
transition-all
hover:bg-slate-50
"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="
rounded-xl
bg-primary
px-6
py-3
font-medium
text-white
transition-all
hover:shadow-lg
disabled:opacity-50
"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        <div>
          <label
            className="
        mb-2
        block
        text-xs
        uppercase
        tracking-[0.12em]
        text-muted-foreground
    "
          >
            Technical Skills
          </label>

          <CreatableSelect<SkillOption, true>
            styles={selectStyles}
            isMulti
            isDisabled={!editMode}
            options={technicalSkillOptions}
            value={Array.isArray(formData.technical_skills) ? formData.technical_skills : []}
            onChange={(value) =>
              setFormData({
                ...formData,
                technical_skills: [...value],
              })
            }
          />
        </div>

        <div>
          <label
            className="
        mb-2
        block
        text-xs
        uppercase
        tracking-[0.12em]
        text-muted-foreground
    "
          >
            Programming Languages
          </label>

          <CreatableSelect<SkillOption, true>
            styles={selectStyles}
            isMulti
            isDisabled={!editMode}
            options={languageOptions}
            value={
              Array.isArray(formData.programming_languages) ? formData.programming_languages : []
            }
            onChange={(value) =>
              setFormData({
                ...formData,
                programming_languages: [...value],
              })
            }
          />
        </div>

        <div>
          <label
            className="
        mb-2
        block
        text-xs
        uppercase
        tracking-[0.12em]
        text-muted-foreground
    "
          >
            Tools & Technologies
          </label>

          <CreatableSelect<SkillOption, true>
            styles={selectStyles}
            isMulti
            isDisabled={!editMode}
            options={toolsOptions}
            value={
              Array.isArray(formData.tools_and_technologies) ? formData.tools_and_technologies : []
            }
            onChange={(value) =>
              setFormData({
                ...formData,
                tools_and_technologies: [...value],
              })
            }
          />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {/* GitHub */}
          <div
            className="
      rounded-2xl
      border
      border-slate-200
      bg-slate-50/60
      p-5
      transition-all
      hover:border-primary/40
      hover:shadow-md
    "
          >
            <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">GitHub</div>

            {editMode ? (
              <input
                type="text"
                name="github_url"
                value={formData.github_url}
                onChange={handleChange}
                className="
          mt-3
          w-full
          rounded-xl
          border
          border-slate-200
          px-3
          py-2
        "
              />
            ) : (
              <a
                href={formData.github_url}
                target="_blank"
                rel="noreferrer"
                className="
          mt-3
          block
          truncate
          font-medium
          text-primary
        "
              >
                View GitHub Profile →
              </a>
            )}
          </div>

          {/* LinkedIn */}
          <div
            className="
      rounded-2xl
      border
      border-slate-200
      bg-slate-50/60
      p-5
      transition-all
      hover:border-primary/40
      hover:shadow-md
    "
          >
            <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              LinkedIn
            </div>

            {editMode ? (
              <input
                type="text"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleChange}
                className="
          mt-3
          w-full
          rounded-xl
          border
          border-slate-200
          px-3
          py-2
        "
              />
            ) : (
              <a
                href={formData.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="
          mt-3
          block
          truncate
          font-medium
          text-primary
        "
              >
                View LinkedIn Profile →
              </a>
            )}
          </div>

          {/* Portfolio */}
          <div
            className="
      rounded-2xl
      border
      border-slate-200
      bg-slate-50/60
      p-5
      transition-all
      hover:border-primary/40
      hover:shadow-md
    "
          >
            <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Portfolio
            </div>

            {editMode ? (
              <input
                type="text"
                name="portfolio_url"
                value={formData.portfolio_url}
                onChange={handleChange}
                className="
          mt-3
          w-full
          rounded-xl
          border
          border-slate-200
          px-3
          py-2
        "
              />
            ) : (
              <a
                href={formData.portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="
          mt-3
          block
          truncate
          font-medium
          text-primary
        "
              >
                View Portfolio →
              </a>
            )}
          </div>
        </div>

        <div
          className="
    rounded-2xl
    border
    border-slate-200
    bg-slate-50/60
    p-5
  "
        >
          <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Professional Strengths
          </div>

          {editMode ? (
            <textarea
              name="strengths"
              value={formData.strengths}
              onChange={handleChange}
              className="
        mt-3
        min-h-[120px]
        w-full
        rounded-xl
        border
        border-slate-200
        px-4
        py-3
      "
            />
          ) : (
            <p className="mt-3 leading-7 text-slate-700">
              {formData.strengths || "No strengths added yet."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
