/**
 * 🎯 Master's Cost Estimator
 * Monthly cost scenarios with breakdown
 */

interface SnapshotNode {
  id: string;
  type: string;
  label: string;
  meta?: Record<string, unknown>;
}

interface CostBreakdown {
  appServers: number;
  database: number;
  cache: number;
  storage: number;
  cdn: number;
  monitoring: number;
  thirdParty: number;
}

interface CostScenario {
  monthly: number;
  breakdown: CostBreakdown;
}

interface CostEstimate {
  low: CostScenario;
  typical: CostScenario;
  peak: CostScenario;
  confidence: "low" | "medium" | "high";
  assumptions: string[];
}

// Pricing constants (AWS-like baseline)
const PRICING = {
  instanceHourly: 0.05, // t3.medium equivalent
  redundancyFactor: 1.5,
  managedDBBase: 50, // RDS small instance
  storagePerGB: 0.023, // S3 standard
  egressPerGB: 0.09, // Data transfer out
  cdnPerGB: 0.02, // CloudFront
  redisBase: 30, // ElastiCache small
  monitoringBase: 100, // Datadog starter
  stripePerTransaction: 0.30 // + 2.9% but simplified
};

export function estimateCosts(
  nodes: SnapshotNode[],
  profile?: { 
    traffic?: "small" | "medium" | "large";
    budget?: "low" | "medium" | "high";
    storageGB?: number;
    requestsPerMonth?: number;
  }
): CostEstimate {
  const trafficMultiplier = {
    small: 1,
    medium: 3,
    peak: 8
  };

  // Count node types
  const appServers = nodes.filter(n => 
    n.type === 'service' || n.type === 'frontend' || n.type === 'gateway'
  ).length || 2; // Default 2 instances

  const databases = nodes.filter(n => n.type === 'database' || n.type === 'db');
  const hasMongoDB = databases.some(n => n.meta?.engine === 'mongodb');
  const hasPostgres = databases.some(n => n.meta?.engine === 'postgres');
  
  const hasCache = nodes.some(n => n.type === 'cache' || n.label.toLowerCase().includes('redis'));
  const hasStorage = nodes.some(n => n.type === 'blob_storage' || n.type === 'storage');
  const hasCDN = nodes.some(n => n.type === 'cdn');
  const hasMonitoring = nodes.some(n => n.type === 'monitoring');
  const hasPayment = nodes.some(n => n.label.toLowerCase().includes('stripe') || n.label.toLowerCase().includes('payment'));

  // Estimate storage and traffic
  const storageGB = profile?.storageGB || (profile?.traffic === 'large' ? 500 : profile?.traffic === 'medium' ? 100 : 20);
  const trafficGB = {
    small: 50,
    medium: 200,
    large: 1000
  }[profile?.traffic || 'medium'];

  const assumptions: string[] = [];

  // Calculate costs
  function calculateScenario(multiplier: number): CostScenario {
    const instanceCount = Math.ceil(appServers * multiplier);
    
    // App servers
    const appCost = PRICING.instanceHourly * instanceCount * 24 * 30 * PRICING.redundancyFactor;
    
    // Database
    let dbCost = 0;
    if (databases.length > 0) {
      dbCost = PRICING.managedDBBase * multiplier;
      if (hasMongoDB) dbCost *= 1.3; // MongoDB Atlas slightly more
      if (databases.length > 1) dbCost *= 1.5; // Multi-DB setup
    }
    
    // Cache
    const cacheCost = hasCache ? PRICING.redisBase * Math.min(multiplier, 2) : 0;
    
    // Storage
    const storageCost = hasStorage ? (storageGB * multiplier * PRICING.storagePerGB) : 0;
    
    // CDN egress
    const cdnCost = hasCDN ? (trafficGB * multiplier * PRICING.cdnPerGB) : (trafficGB * multiplier * PRICING.egressPerGB * 0.3);
    
    // Monitoring
    const monitoringCost = hasMonitoring ? PRICING.monitoringBase : 0;
    
    // Third-party (Stripe rough estimate)
    const thirdPartyCost = hasPayment ? (100 * multiplier * PRICING.stripePerTransaction) : 0;

    const breakdown: CostBreakdown = {
      appServers: Math.round(appCost * 100) / 100,
      database: Math.round(dbCost * 100) / 100,
      cache: Math.round(cacheCost * 100) / 100,
      storage: Math.round(storageCost * 100) / 100,
      cdn: Math.round(cdnCost * 100) / 100,
      monitoring: monitoringCost,
      thirdParty: Math.round(thirdPartyCost * 100) / 100
    };

    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    return {
      monthly: Math.round(total * 100) / 100,
      breakdown
    };
  }

  // Generate scenarios
  const low = calculateScenario(trafficMultiplier.small);
  const typical = calculateScenario(trafficMultiplier.medium);
  const peak = calculateScenario(trafficMultiplier.peak);

  // Assumptions
  assumptions.push(`${appServers} app server instances with ${PRICING.redundancyFactor}x redundancy`);
  if (databases.length > 0) {
    assumptions.push(`Managed database (${hasMongoDB ? 'MongoDB Atlas' : hasPostgres ? 'RDS Postgres' : 'RDS'})`);
  }
  assumptions.push(`${storageGB}GB storage baseline`);
  assumptions.push(`${trafficGB}GB/month typical egress`);
  if (hasCache) assumptions.push('Redis cache for session/data caching');
  if (hasCDN) assumptions.push('CDN for static asset delivery');

  // Confidence based on user inputs
  let confidence: "low" | "medium" | "high" = "medium";
  if (!profile?.traffic || !profile?.storageGB) {
    confidence = "low";
    assumptions.push('⚠️ Traffic and storage estimates are rough - adjust sliders for accuracy');
  } else if (profile.traffic && profile.storageGB && profile.requestsPerMonth) {
    confidence = "high";
  }

  return {
    low,
    typical,
    peak,
    confidence,
    assumptions
  };
}
