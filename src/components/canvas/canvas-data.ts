/**
 * Static data definitions for the Architecture Canvas.
 * Defines 20 MVP-enabled components (plus non-MVP placeholders) and 8 connection types.
 *
 * Validates: Requirements 6.1, 6.2
 */

import type {
  CanvasComponentDefinition,
  ConnectionType,
} from '@/types';

/**
 * All 20 MVP-enabled canvas component definitions grouped by category.
 * Non-MVP components are included but marked with mvpEnabled: false.
 */
export const CANVAS_COMPONENTS: CanvasComponentDefinition[] = [
  // ─── Containers ────────────────────────────────────────────────────────────
  {
    id: 'vpc',
    name: 'VPC',
    category: 'container',
    icon: 'network',
    defaultSize: { width: 400, height: 300 },
    allowedChildren: ['subnet', 'public-subnet', 'private-subnet', 'igw', 'nat-gateway', 'ec2', 'alb', 'ecs', 'lambda', 'rds', 'elasticache', 'security-group'],
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
      { id: 'left', position: 'left', allowSource: true, allowTarget: true },
      { id: 'right', position: 'right', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  {
    id: 'public-subnet',
    name: 'Public Subnet',
    category: 'container',
    icon: 'globe',
    defaultSize: { width: 300, height: 200 },
    allowedParents: ['vpc'],
    allowedChildren: ['ec2', 'alb', 'nat-gateway', 'security-group'],
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
      { id: 'left', position: 'left', allowSource: true, allowTarget: true },
      { id: 'right', position: 'right', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  {
    id: 'private-subnet',
    name: 'Private Subnet',
    category: 'container',
    icon: 'lock',
    defaultSize: { width: 300, height: 200 },
    allowedParents: ['vpc'],
    allowedChildren: ['ec2', 'rds', 'elasticache', 'ecs', 'lambda', 'security-group'],
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
      { id: 'left', position: 'left', allowSource: true, allowTarget: true },
      { id: 'right', position: 'right', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  // ─── Compute ───────────────────────────────────────────────────────────────
  {
    id: 'ec2',
    name: 'EC2',
    category: 'standalone',
    icon: 'server',
    defaultSize: { width: 80, height: 80 },
    allowedParents: ['public-subnet', 'private-subnet'],
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
      { id: 'left', position: 'left', allowSource: true, allowTarget: true },
      { id: 'right', position: 'right', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  {
    id: 'ecs',
    name: 'ECS',
    category: 'standalone',
    icon: 'container',
    defaultSize: { width: 80, height: 80 },
    allowedParents: ['public-subnet', 'private-subnet'],
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
      { id: 'left', position: 'left', allowSource: true, allowTarget: true },
      { id: 'right', position: 'right', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  {
    id: 'lambda',
    name: 'Lambda',
    category: 'standalone',
    icon: 'zap',
    defaultSize: { width: 80, height: 80 },
    allowedParents: ['public-subnet', 'private-subnet'],
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
      { id: 'left', position: 'left', allowSource: true, allowTarget: true },
      { id: 'right', position: 'right', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  {
    id: 'auto-scaling',
    name: 'Auto Scaling',
    category: 'standalone',
    icon: 'scaling',
    defaultSize: { width: 80, height: 80 },
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
      { id: 'left', position: 'left', allowSource: true, allowTarget: true },
      { id: 'right', position: 'right', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  // ─── Networking ────────────────────────────────────────────────────────────
  {
    id: 'alb',
    name: 'ALB',
    category: 'standalone',
    icon: 'split',
    defaultSize: { width: 80, height: 80 },
    allowedParents: ['public-subnet'],
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
      { id: 'left', position: 'left', allowSource: true, allowTarget: true },
      { id: 'right', position: 'right', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  {
    id: 'igw',
    name: 'Internet Gateway',
    category: 'standalone',
    icon: 'wifi',
    defaultSize: { width: 80, height: 80 },
    allowedParents: ['vpc'],
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
      { id: 'left', position: 'left', allowSource: true, allowTarget: true },
      { id: 'right', position: 'right', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  {
    id: 'nat-gateway',
    name: 'NAT Gateway',
    category: 'standalone',
    icon: 'arrow-right-left',
    defaultSize: { width: 80, height: 80 },
    allowedParents: ['public-subnet'],
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
      { id: 'left', position: 'left', allowSource: true, allowTarget: true },
      { id: 'right', position: 'right', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  {
    id: 'route-table',
    name: 'Route Table',
    category: 'attached',
    icon: 'table',
    defaultSize: { width: 60, height: 60 },
    allowedParents: ['public-subnet', 'private-subnet'],
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  {
    id: 'security-group',
    name: 'Security Group',
    category: 'attached',
    icon: 'shield',
    defaultSize: { width: 60, height: 60 },
    allowedParents: ['vpc', 'public-subnet', 'private-subnet'],
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
      { id: 'left', position: 'left', allowSource: true, allowTarget: true },
      { id: 'right', position: 'right', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  {
    id: 'elastic-ip',
    name: 'Elastic IP',
    category: 'attached',
    icon: 'pin',
    defaultSize: { width: 60, height: 60 },
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  // ─── Global / Edge ─────────────────────────────────────────────────────────
  {
    id: 'cloudfront',
    name: 'CloudFront',
    category: 'standalone',
    icon: 'cloud',
    defaultSize: { width: 80, height: 80 },
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
      { id: 'left', position: 'left', allowSource: true, allowTarget: true },
      { id: 'right', position: 'right', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  {
    id: 'route53',
    name: 'Route 53',
    category: 'standalone',
    icon: 'globe-2',
    defaultSize: { width: 80, height: 80 },
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
      { id: 'left', position: 'left', allowSource: true, allowTarget: true },
      { id: 'right', position: 'right', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  // ─── Storage ───────────────────────────────────────────────────────────────
  {
    id: 's3',
    name: 'S3',
    category: 'standalone',
    icon: 'hard-drive',
    defaultSize: { width: 80, height: 80 },
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
      { id: 'left', position: 'left', allowSource: true, allowTarget: true },
      { id: 'right', position: 'right', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  {
    id: 'efs',
    name: 'EFS',
    category: 'standalone',
    icon: 'folder',
    defaultSize: { width: 80, height: 80 },
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
      { id: 'left', position: 'left', allowSource: true, allowTarget: true },
      { id: 'right', position: 'right', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  // ─── Database ──────────────────────────────────────────────────────────────
  {
    id: 'rds',
    name: 'RDS',
    category: 'standalone',
    icon: 'database',
    defaultSize: { width: 80, height: 80 },
    allowedParents: ['private-subnet'],
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
      { id: 'left', position: 'left', allowSource: true, allowTarget: true },
      { id: 'right', position: 'right', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  {
    id: 'elasticache',
    name: 'ElastiCache',
    category: 'standalone',
    icon: 'cpu',
    defaultSize: { width: 80, height: 80 },
    allowedParents: ['private-subnet'],
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
      { id: 'left', position: 'left', allowSource: true, allowTarget: true },
      { id: 'right', position: 'right', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  // ─── External ──────────────────────────────────────────────────────────────
  {
    id: 'users',
    name: 'Users',
    category: 'standalone',
    icon: 'users',
    defaultSize: { width: 80, height: 80 },
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
      { id: 'left', position: 'left', allowSource: true, allowTarget: true },
      { id: 'right', position: 'right', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: true,
  },
  // ─── Non-MVP (greyed out) ──────────────────────────────────────────────────
  {
    id: 'transit-gateway',
    name: 'Transit Gateway',
    category: 'standalone',
    icon: 'git-branch',
    defaultSize: { width: 80, height: 80 },
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: false,
  },
  {
    id: 'direct-connect',
    name: 'Direct Connect',
    category: 'standalone',
    icon: 'cable',
    defaultSize: { width: 80, height: 80 },
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: false,
  },
  {
    id: 'vpn-gateway',
    name: 'VPN Gateway',
    category: 'standalone',
    icon: 'key',
    defaultSize: { width: 80, height: 80 },
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: false,
  },
  {
    id: 'global-accelerator',
    name: 'Global Accelerator',
    category: 'standalone',
    icon: 'rocket',
    defaultSize: { width: 80, height: 80 },
    connectionPoints: [
      { id: 'top', position: 'top', allowSource: true, allowTarget: true },
      { id: 'bottom', position: 'bottom', allowSource: true, allowTarget: true },
    ],
    mvpEnabled: false,
  },
];

/** Palette groupings for display in the sidebar */
export const PALETTE_GROUPS: { label: string; componentIds: string[] }[] = [
  { label: 'Containers', componentIds: ['vpc', 'public-subnet', 'private-subnet'] },
  { label: 'Compute', componentIds: ['ec2', 'ecs', 'lambda', 'auto-scaling'] },
  { label: 'Networking', componentIds: ['alb', 'igw', 'nat-gateway', 'route-table', 'security-group', 'elastic-ip'] },
  { label: 'Global/Edge', componentIds: ['cloudfront', 'route53'] },
  { label: 'Storage', componentIds: ['s3', 'efs'] },
  { label: 'Database', componentIds: ['rds', 'elasticache'] },
  { label: 'External', componentIds: ['users'] },
  { label: 'Coming Soon', componentIds: ['transit-gateway', 'direct-connect', 'vpn-gateway', 'global-accelerator'] },
];

/**
 * 8 connection types with distinct visual styles.
 * Each conveys a different architectural relationship.
 */
export const CONNECTION_TYPES: ConnectionType[] = [
  {
    id: 'data-flow',
    name: 'Data Flow',
    style: { strokeColor: '#3b82f6', strokeWidth: 2, strokeDasharray: [], animated: true },
    validSourceTypes: ['*'],
    validTargetTypes: ['*'],
  },
  {
    id: 'https',
    name: 'HTTPS',
    style: { strokeColor: '#22c55e', strokeWidth: 2, strokeDasharray: [], animated: false },
    validSourceTypes: ['*'],
    validTargetTypes: ['*'],
  },
  {
    id: 'tcp-ip',
    name: 'TCP/IP',
    style: { strokeColor: '#a855f7', strokeWidth: 2, strokeDasharray: [5, 5], animated: false },
    validSourceTypes: ['*'],
    validTargetTypes: ['*'],
  },
  {
    id: 'dns-resolution',
    name: 'DNS Resolution',
    style: { strokeColor: '#f59e0b', strokeWidth: 1, strokeDasharray: [3, 3], animated: false },
    validSourceTypes: ['*'],
    validTargetTypes: ['route53'],
  },
  {
    id: 'vpc-peering',
    name: 'VPC Peering',
    style: { strokeColor: '#ec4899', strokeWidth: 3, strokeDasharray: [], animated: false },
    validSourceTypes: ['vpc'],
    validTargetTypes: ['vpc'],
  },
  {
    id: 'replication',
    name: 'Replication',
    style: { strokeColor: '#06b6d4', strokeWidth: 2, strokeDasharray: [8, 4], animated: true },
    validSourceTypes: ['rds', 's3', 'elasticache'],
    validTargetTypes: ['rds', 's3', 'elasticache'],
  },
  {
    id: 'event-trigger',
    name: 'Event/Trigger',
    style: { strokeColor: '#f97316', strokeWidth: 2, strokeDasharray: [2, 2], animated: true },
    validSourceTypes: ['s3', 'lambda'],
    validTargetTypes: ['lambda', 'ecs'],
  },
  {
    id: 'iam-policy',
    name: 'IAM Policy',
    style: { strokeColor: '#ef4444', strokeWidth: 1, strokeDasharray: [4, 2], animated: false },
    validSourceTypes: ['*'],
    validTargetTypes: ['*'],
  },
];

/** Look up a component definition by ID */
export function getComponentDefinition(id: string): CanvasComponentDefinition | undefined {
  return CANVAS_COMPONENTS.find((c) => c.id === id);
}

/** Look up a connection type by ID */
export function getConnectionType(id: string): ConnectionType | undefined {
  return CONNECTION_TYPES.find((c) => c.id === id);
}
