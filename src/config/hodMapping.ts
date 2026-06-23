import { ELIGIBILITY_MAPPING } from "@/constants/eligibilityMapping";

export const DEFAULT_HOD_EMAIL = "shrey36870@gmail.com";

export const NOC_EMAIL_CONFIG = {
  DEPUTY_TNP_EMAIL: "deputy.tnp@indusuni.ac.in",

  PLACEMENT_CELL_EMAIL: "placement@indusuni.ac.in",
};

export const HOD_EMAILS = {
  IITE: {
    "B.Tech": {
      "Information Communication Technology (ICT)": DEFAULT_HOD_EMAIL,

      "Civil Engineering": DEFAULT_HOD_EMAIL,

      "Automobile Engineering": DEFAULT_HOD_EMAIL,

      "Mechanical Engineering": DEFAULT_HOD_EMAIL,

      "Metallurgical Engineering": DEFAULT_HOD_EMAIL,

      "Electrical Engineering": DEFAULT_HOD_EMAIL,

      "Electronics & Communication Engineering": DEFAULT_HOD_EMAIL,

      "Computer Engineering": DEFAULT_HOD_EMAIL,

      "Cyber Security": DEFAULT_HOD_EMAIL,

      "Information Technology": DEFAULT_HOD_EMAIL,

      "Computer Science Engineering": DEFAULT_HOD_EMAIL,

      "Aircraft Maintenance Engineering": DEFAULT_HOD_EMAIL,

      "Aeronautical Engineering": DEFAULT_HOD_EMAIL,

      "Aerospace Engineering": DEFAULT_HOD_EMAIL,

      "Defence Aerospace Engineering": DEFAULT_HOD_EMAIL,
    },

    "B.Tech (D to D)": {
      "Information Communication Technology (ICT)": DEFAULT_HOD_EMAIL,

      "Civil Engineering": DEFAULT_HOD_EMAIL,

      "Automobile Engineering": DEFAULT_HOD_EMAIL,

      "Mechanical Engineering": DEFAULT_HOD_EMAIL,

      "Metallurgical Engineering": DEFAULT_HOD_EMAIL,

      "Electrical Engineering": DEFAULT_HOD_EMAIL,

      "Electronics & Communication Engineering": DEFAULT_HOD_EMAIL,

      "Computer Engineering": DEFAULT_HOD_EMAIL,

      "Cyber Security": DEFAULT_HOD_EMAIL,

      "Information Technology": DEFAULT_HOD_EMAIL,

      "Computer Science Engineering": DEFAULT_HOD_EMAIL,
    },

    "M.Tech": {
      "CAD/CAM (Mechanical Engineering)": DEFAULT_HOD_EMAIL,

      "Construction Project Management (Civil Engineering)": DEFAULT_HOD_EMAIL,

      "Digital Communication (EC Engineering)": DEFAULT_HOD_EMAIL,

      "Electrical Power System": DEFAULT_HOD_EMAIL,

      "Industrial Metallurgy": DEFAULT_HOD_EMAIL,

      "Structural Engineering (Civil Engineering)": DEFAULT_HOD_EMAIL,

      "Data Science (Computer)": DEFAULT_HOD_EMAIL,

      "Cyber Security": DEFAULT_HOD_EMAIL,
    },
  },

  IIICT: {
    "B.Sc": {
      "Data Science": DEFAULT_HOD_EMAIL,

      "Computer Application (CA) & Information Technology (IT)": DEFAULT_HOD_EMAIL,

      "Clinical Research and Health Care Management (Hons)": DEFAULT_HOD_EMAIL,

      "Mathematics (Hons)": DEFAULT_HOD_EMAIL,

      "Physics (Hons)": DEFAULT_HOD_EMAIL,

      "Chemistry (Hons)": DEFAULT_HOD_EMAIL,

      "Cyber Security (Hons)": DEFAULT_HOD_EMAIL,

      "Microbiology (Hons)": DEFAULT_HOD_EMAIL,

      "Computer Science (AI & ML)": DEFAULT_HOD_EMAIL,
    },

    "M.Sc": {
      "Information Technology (IT)": DEFAULT_HOD_EMAIL,

      "Clinical Research": DEFAULT_HOD_EMAIL,

      Mathematics: DEFAULT_HOD_EMAIL,

      Physics: DEFAULT_HOD_EMAIL,

      Chemistry: DEFAULT_HOD_EMAIL,

      "Cyber Security": DEFAULT_HOD_EMAIL,

      Microbiology: DEFAULT_HOD_EMAIL,
    },

    BCA: {
      BCA: DEFAULT_HOD_EMAIL,
    },

    MCA: {
      "IMCA (BCA + MCA)": DEFAULT_HOD_EMAIL,

      MCA: DEFAULT_HOD_EMAIL,
    },
  },

  IIDEA: {
    "B.Des": {
      "Product Design": DEFAULT_HOD_EMAIL,

      "Interior Design": DEFAULT_HOD_EMAIL,

      "Fashion Design": DEFAULT_HOD_EMAIL,

      "Communication Design (Graphic Design)": DEFAULT_HOD_EMAIL,
    },

    "M.Des": {
      "Fashion Design": DEFAULT_HOD_EMAIL,

      "Interior Design": DEFAULT_HOD_EMAIL,

      "UI-UX Design": DEFAULT_HOD_EMAIL,
    },

    "B.Arch": {
      "Bachelor of Architecture": DEFAULT_HOD_EMAIL,
    },
  },

  IIL: {
    "LLB (Hons)": {
      Law: DEFAULT_HOD_EMAIL,
    },

    "Integrated BA LLB (Hons)": {
      Law: DEFAULT_HOD_EMAIL,
    },

    "Integrated BBA LLB (Hons)": {
      Law: DEFAULT_HOD_EMAIL,
    },
  },

  IIMS: {
    BBA: {
      "Aviation Management": DEFAULT_HOD_EMAIL,

      BBA: DEFAULT_HOD_EMAIL,
    },

    "BBA + MBA": {
      "Dual Degree": DEFAULT_HOD_EMAIL,
    },

    MBA: {
      "IMBA (BBA + MBA)": DEFAULT_HOD_EMAIL,

      Finance: DEFAULT_HOD_EMAIL,

      "Human Resource": DEFAULT_HOD_EMAIL,
    },
  },

  IISHLS: {
    "B.Com": {
      "Bachelor of Commerce (Hons)": DEFAULT_HOD_EMAIL,
    },

    "B.A.": {
      "English (Hons)": DEFAULT_HOD_EMAIL,
    },
  },

  IIPR: {
    "B.Pharm": {
      "Bachelor of Pharmacy": DEFAULT_HOD_EMAIL,
    },

    "B.Pharm (D to D)": {
      Pharmacy: DEFAULT_HOD_EMAIL,
    },
  },
};

export function getHodEmail(institute: string, degree: string, branch: string) {
  return (
    HOD_EMAILS?.[institute as keyof typeof HOD_EMAILS]?.[
      degree as keyof (typeof HOD_EMAILS)[keyof typeof HOD_EMAILS]
    ]?.[branch as any] ?? DEFAULT_HOD_EMAIL
  );
}

export function isValidEligibilityPath(institute: string, degree: string, branch: string) {
  const branches =
    (ELIGIBILITY_MAPPING as Record<string, Record<string, readonly string[] | undefined>>)?.[
      institute
    ]?.[degree] ?? [];

  return branches.includes(branch);
}
