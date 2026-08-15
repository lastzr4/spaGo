import type { Gender, ClientGenderPolicy } from "@prisma/client";

// Strict gender-matching safety rule:
// - Female customers may book female therapists (policy FEMALE_ONLY or BOTH).
// - Male customers may ONLY book male therapists (policy MALE_ONLY or BOTH),
//   never a female therapist, regardless of that therapist's policy.
export function isMatch(customerGender: Gender, therapistGender: Gender, policy: ClientGenderPolicy) {
  if (customerGender === "MALE") {
    return therapistGender === "MALE" && (policy === "MALE_ONLY" || policy === "BOTH");
  }
  // customerGender === "FEMALE"
  if (therapistGender === "FEMALE") {
    return policy === "FEMALE_ONLY" || policy === "BOTH";
  }
  // Female customer + male therapist: not offered in MVP (outcall safety default off).
  return false;
}
