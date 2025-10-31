// Constants mapping for Pastoral Support related head IDs.
// Set these numeric IDs to match your backend Head records.
// Only entries with head IDs > 0 will be submitted.
export const PASTORAL_HEAD_IDS = {
  BASIC_DA: 199,
  BOOK_ALLOWANCE: 200,
  CHILD_ALLOWANCE: 203,
  CONVEYANCE_PETROL_ALLOWANCE: 201,
  HOSPITALITY_ALLOWANCE: 205,
  MEDICAL_ALLOWANCE: 208,
  PF: 207,
  RENT: 215,
  SPECIAL_ALLOWANCE: 206,
  TELEPHONE_INTERNET: 219,
} as const;

export type PastoralHeadKey = keyof typeof PASTORAL_HEAD_IDS;