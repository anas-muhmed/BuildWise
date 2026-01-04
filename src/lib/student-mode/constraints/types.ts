export type ConstraintFix = {
  id: string;
  label: string;
  description: string;
  action: {
    type: 'UPDATE_DECISION';
    payload: {
      key: string;
      value: string;
    };
  };
};

export type ConstraintViolation = {
  reason: string;
  affectedNodeType?: string;
  fixes?: ConstraintFix[];
};

export type ConstraintResult = {
  allowed: boolean;
  violation?: ConstraintViolation;
};
