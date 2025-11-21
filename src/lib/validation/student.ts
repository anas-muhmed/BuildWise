// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateStudentProjectPayload(body: any) {
  if (!body.appType) return { valid: false, error: "appType required" };
  if (body.skillLevel && !["beginner","intermediate","advanced"].includes(body.skillLevel)) {
    return { valid: false, error: "invalid skillLevel" };
  }
  return { valid: true };
}
