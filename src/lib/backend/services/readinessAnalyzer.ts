/**
 * 🎯 Master's Readiness Analyzer
 * Automated health checks for architecture snapshots
 */

interface SnapshotNode {
  id: string;
  type: string;
  label: string;
  meta?: Record<string, unknown>;
}

interface Check {
  id: string;
  severity: "info" | "warning" | "critical";
  category: "security" | "reliability" | "cost" | "observability" | "deployment";
  message: string;
  resolution: string;
  code?: string;
}

interface ReadinessReport {
  overallScore: number;
  checks: Check[];
  timestamp: Date;
}

export function generateReadinessReport(
  nodes: SnapshotNode[],
  proposal?: { features?: string[]; traffic?: string; budget?: string }
): ReadinessReport {
  const checks: Check[] = [];

  // Authentication & Authorization
  const hasAuth = nodes.some(n => n.type === 'auth' || n.label.toLowerCase().includes('auth'));
  const requiresAuth = proposal?.features?.some(f => 
    f.includes('payment') || f.includes('user') || f.includes('profile')
  );
  
  if (requiresAuth && !hasAuth) {
    checks.push({
      id: 'auth-missing',
      severity: 'critical',
      category: 'security',
      message: 'Authentication service missing',
      resolution: 'Add an auth service (Auth0, Cognito) or implement JWT authentication',
      code: 'AUTH_MISSING'
    });
  }

  // Database reliability
  const databases = nodes.filter(n => n.type === 'database' || n.type === 'db');
  if (databases.length === 1) {
    checks.push({
      id: 'db-single',
      severity: 'warning',
      category: 'reliability',
      message: 'Single database instance detected',
      resolution: 'Consider read replicas or managed DB with HA for production',
      code: 'DB_NO_REPLICA'
    });
  }

  // Network security
  const publicDB = databases.some(n => 
    !n.meta?.private && !n.meta?.vpc
  );
  if (publicDB) {
    checks.push({
      id: 'db-public',
      severity: 'critical',
      category: 'security',
      message: 'Database exposed to public network',
      resolution: 'Place DB in VPC with private subnets and security groups',
      code: 'DB_PUBLIC_EXPOSURE'
    });
  }

  // Real-time capability
  const hasRealtime = proposal?.features?.some(f => 
    f.includes('real-time') || f.includes('websocket') || f.includes('live')
  );
  const hasWebSocket = nodes.some(n => 
    n.type === 'websocket' || n.type === 'queue' || n.type === 'cache'
  );
  
  if (hasRealtime && !hasWebSocket) {
    checks.push({
      id: 'realtime-missing',
      severity: 'warning',
      category: 'reliability',
      message: 'Real-time features require WebSocket or message queue',
      resolution: 'Add Redis Pub/Sub, Socket.IO, or message queue (RabbitMQ, SQS)',
      code: 'REALTIME_MISSING'
    });
  }

  // Storage & CDN
  const hasFileUploads = proposal?.features?.some(f => 
    f.includes('upload') || f.includes('media') || f.includes('file')
  );
  const hasObjectStorage = nodes.some(n => 
    n.type === 'blob_storage' || n.type === 'storage'
  );
  const hasCDN = nodes.some(n => n.type === 'cdn');
  
  if (hasFileUploads && !hasObjectStorage) {
    checks.push({
      id: 'storage-missing',
      severity: 'warning',
      category: 'cost',
      message: 'Large file uploads should use object storage',
      resolution: 'Add S3, Azure Blob, or GCS for scalable file storage',
      code: 'STORAGE_MISSING'
    });
  }

  if (hasObjectStorage && !hasCDN && proposal?.traffic === 'large') {
    checks.push({
      id: 'cdn-recommended',
      severity: 'info',
      category: 'cost',
      message: 'CDN recommended for high-traffic media delivery',
      resolution: 'Add CloudFront, Cloudflare, or Fastly to reduce latency and egress costs',
      code: 'CDN_RECOMMENDED'
    });
  }

  // Observability
  const hasMonitoring = nodes.some(n => 
    n.type === 'monitoring' || n.label.toLowerCase().includes('monitor') ||
    n.label.toLowerCase().includes('datadog') || n.label.toLowerCase().includes('prometheus')
  );
  
  if (!hasMonitoring) {
    checks.push({
      id: 'monitoring-missing',
      severity: 'warning',
      category: 'observability',
      message: 'No monitoring/logging service detected',
      resolution: 'Add Datadog, Prometheus, CloudWatch, or ELK stack',
      code: 'MONITORING_MISSING'
    });
  }

  // CI/CD & Deployment
  const hasGateway = nodes.some(n => 
    n.type === 'gateway' || n.type === 'loadbalancer'
  );
  
  if (!hasGateway && nodes.length > 3) {
    checks.push({
      id: 'gateway-missing',
      severity: 'info',
      category: 'deployment',
      message: 'API Gateway or Load Balancer recommended',
      resolution: 'Add API Gateway for routing, rate limiting, and SSL termination',
      code: 'GATEWAY_RECOMMENDED'
    });
  }

  // Payment provider fallback
  const hasPayment = proposal?.features?.some(f => 
    f.includes('payment') || f.includes('checkout')
  );
  const paymentNodes = nodes.filter(n => 
    n.label.toLowerCase().includes('stripe') || 
    n.label.toLowerCase().includes('payment')
  );
  
  if (hasPayment && paymentNodes.length === 1) {
    checks.push({
      id: 'payment-no-fallback',
      severity: 'info',
      category: 'reliability',
      message: 'Consider payment provider fallback',
      resolution: 'Add backup payment gateway (Stripe + PayPal) for higher reliability',
      code: 'PAYMENT_SINGLE'
    });
  }

  // Calculate overall score
  const criticalPenalty = checks.filter(c => c.severity === 'critical').length * 30;
  const warningPenalty = checks.filter(c => c.severity === 'warning').length * 10;
  const infoPenalty = checks.filter(c => c.severity === 'info').length * 5;
  
  const overallScore = Math.max(0, Math.min(100, 100 - criticalPenalty - warningPenalty - infoPenalty));

  return {
    overallScore,
    checks,
    timestamp: new Date()
  };
}
