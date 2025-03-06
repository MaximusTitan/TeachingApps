export const countries = [
  { value: "india", label: "India" },
  { value: "nigeria", label: "Nigeria" },
  { value: "usa", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "canada", label: "Canada" },
  { value: "australia", label: "Australia" },
  { value: "other", label: "Other" },
];

export const boardsByCountry: Record<string, { value: string; label: string }[]> = {
  india: [
    { value: "cbse", label: "CBSE" },
    { value: "cisce", label: "CISCE" },
    { value: "state-board", label: "State Board" },
    { value: "ib", label: "IB" },
    { value: "igcse", label: "IGCSE" },
    { value: "nios", label: "NIOS" },
  ],
  nigeria: [
    { value: "waec", label: "WAEC" },
    { value: "neco", label: "NECO" },
    { value: "ubec", label: "UBEC" },
    { value: "state-board", label: "State Education Board" },
    { value: "cambridge", label: "Cambridge International" },
    { value: "ib", label: "IB" },
  ],
  usa: [
    { value: "state-board", label: "State Board" },
    { value: "common-core", label: "Common Core" },
    { value: "ap", label: "AP" },
    { value: "ib", label: "IB" },
  ],
  uk: [
    { value: "national-curriculum", label: "National Curriculum" },
    { value: "gcse", label: "GCSE" },
    { value: "a-levels", label: "A-Levels" },
    { value: "scottish", label: "Scottish Qualifications" },
    { value: "ib", label: "IB" },
  ],
  canada: [
    { value: "provincial", label: "Provincial Curriculum" },
    { value: "ib", label: "IB" },
  ],
  australia: [
    { value: "australian", label: "Australian Curriculum" },
    { value: "state", label: "State Curriculum" },
    { value: "ib", label: "IB" },
  ],
  other: [
    { value: "national", label: "National Curriculum" },
    { value: "international", label: "International Curriculum" },
    { value: "other", label: "Other" },
  ],
};

export const subjects = [
  { value: "mathematics", label: "Mathematics" },
  { value: "science", label: "Science" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "biology", label: "Biology" },
  { value: "english", label: "English" },
  { value: "history", label: "History" },
  { value: "geography", label: "Geography" },
  { value: "computer-science", label: "Computer Science" },
  { value: "economics", label: "Economics" },
];
