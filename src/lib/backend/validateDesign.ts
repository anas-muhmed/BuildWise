interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateDesign(data: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  edges?: any;
}): ValidationResult {
  if (!data.nodes || !Array.isArray(data.nodes)) {
    return { valid: false, error: "nodes must be an array" };
  }
  if (!data.edges || !Array.isArray(data.edges)) {
    return { valid: false, error: "edges must be an array" };
  }

  //check limit of nodes>500
  if (data.nodes.length > 500) {
    return { valid: false, error: "Maximum 500 nodes allowed" };
  }

  //Check each node has required fields
  for (const node of data.nodes) {
    if (!node.id || !node.label) {
      return { valid: false, error: "Each node must have id and label" };
    }
  }

  return { valid: true };
}
