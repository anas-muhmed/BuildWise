/**
 * Get a color for a block based on its type
 */
export function getBlockColor(type: string): string {
  // Normalize type to lowercase for consistent matching
  const normalizedType = type.toLowerCase();
  
  if (normalizedType.includes('frontend')) return 'bg-yellow-50 text-yellow-800';
  if (normalizedType.includes('backend')) return 'bg-green-50 text-green-800';
  if (normalizedType.includes('database') || normalizedType.includes('db')) return 'bg-blue-50 text-blue-800';
  if (normalizedType.includes('auth')) return 'bg-purple-50 text-purple-800';
  if (normalizedType.includes('api')) return 'bg-indigo-50 text-indigo-800';
  if (normalizedType.includes('cache')) return 'bg-red-50 text-red-800';
  if (normalizedType.includes('queue')) return 'bg-orange-50 text-orange-800';
  if (normalizedType.includes('storage')) return 'bg-cyan-50 text-cyan-800';
  
  // Default
  return 'bg-gray-50 text-gray-800';
}

/**
 * Get a color for an edge based on source block type
 */
export function getEdgeColor(type: string): string {
  // Similar to getBlockColor but returns just hex colors for SVG strokes
  const normalizedType = type.toLowerCase();
  
  if (normalizedType.includes('frontend')) return '#ca8a04'; // yellow-600
  if (normalizedType.includes('backend')) return '#16a34a'; // green-600
  if (normalizedType.includes('database') || normalizedType.includes('db')) return '#2563eb'; // blue-600
  if (normalizedType.includes('auth')) return '#9333ea'; // purple-600
  if (normalizedType.includes('api')) return '#4f46e5'; // indigo-600
  if (normalizedType.includes('cache')) return '#dc2626'; // red-600
  if (normalizedType.includes('queue')) return '#ea580c'; // orange-600
  if (normalizedType.includes('storage')) return '#0891b2'; // cyan-600
  
  // Default
  return '#4b5563'; // gray-600
}
