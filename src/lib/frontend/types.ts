export type ConflictItem = {
  id: string;
  moduleId: string;
  type: string;
  message: string;
  resolution?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any;
};
