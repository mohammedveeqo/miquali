/**
 * Canvas Validation Engine — Implements 9 placement rules for the Architecture Canvas.
 * Validates component placement in real time and full diagram validation before submission.
 * All functions are pure (no side effects).
 */

import type {
  CanvasComponentInstance,
  DiagramState,
  ValidationResult,
  PlacementRule,
} from '@/types';

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Returns the definitionId of the parent component, or null if the component
 * has no parent or the parent is not found in the diagram.
 */
function getParentDefinitionId(
  component: CanvasComponentInstance,
  diagram: DiagramState
): string | null {
  if (!component.parentId) return null;
  const parent = diagram.components.find((c) => c.id === component.parentId);
  return parent ? parent.definitionId : null;
}

/**
 * Checks whether a component is inside a container of a given definitionId.
 */
function isInsideContainerType(
  component: CanvasComponentInstance,
  containerDefinitionId: string,
  diagram: DiagramState
): boolean {
  return getParentDefinitionId(component, diagram) === containerDefinitionId;
}

/**
 * Checks whether a component is inside any subnet (public or private).
 */
function isInsideAnySubnet(
  component: CanvasComponentInstance,
  diagram: DiagramState
): boolean {
  const parentDef = getParentDefinitionId(component, diagram);
  return parentDef === 'subnet' || parentDef === 'public-subnet' || parentDef === 'private-subnet';
}

/**
 * Checks whether a component is inside a VPC (directly or nested inside a subnet within a VPC).
 */
function isInsideVPC(
  component: CanvasComponentInstance,
  diagram: DiagramState
): boolean {
  // Direct child of VPC
  if (isInsideContainerType(component, 'vpc', diagram)) return true;

  // Inside a subnet that is inside a VPC
  if (component.parentId) {
    const parent = diagram.components.find((c) => c.id === component.parentId);
    if (parent && (parent.definitionId === 'subnet' || parent.definitionId === 'public-subnet' || parent.definitionId === 'private-subnet')) {
      return isInsideContainerType(parent, 'vpc', diagram);
    }
  }

  return false;
}

/**
 * Checks whether a component is inside a public subnet specifically.
 */
function isInsidePublicSubnet(
  component: CanvasComponentInstance,
  diagram: DiagramState
): boolean {
  return getParentDefinitionId(component, diagram) === 'public-subnet';
}

/**
 * Checks whether a Security Group is attached to at least one resource via connections.
 */
function isSecurityGroupAttached(
  component: CanvasComponentInstance,
  diagram: DiagramState
): boolean {
  // A security group is "attached" if it has a parentId (placed inside a resource)
  // or if there is a connection involving it
  if (component.parentId) return true;

  return diagram.connections.some(
    (conn) => conn.sourceId === component.id || conn.targetId === component.id
  );
}

/**
 * Counts the number of distinct Availability Zones (subnets) that an ALB spans.
 * ALB needs subnets in at least 2 AZs. We approximate AZs by counting distinct
 * subnet parents that the ALB is connected to.
 */
function getALBSubnetCount(
  component: CanvasComponentInstance,
  diagram: DiagramState
): number {
  // Find all subnets the ALB is connected to
  const connectedSubnetIds = new Set<string>();

  for (const conn of diagram.connections) {
    let targetId: string | null = null;

    if (conn.sourceId === component.id) {
      targetId = conn.targetId;
    } else if (conn.targetId === component.id) {
      targetId = conn.sourceId;
    }

    if (targetId) {
      const target = diagram.components.find((c) => c.id === targetId);
      if (
        target &&
        (target.definitionId === 'subnet' ||
          target.definitionId === 'public-subnet' ||
          target.definitionId === 'private-subnet')
      ) {
        connectedSubnetIds.add(target.id);
      }
    }
  }

  // Also count the subnet the ALB is placed in (if any)
  if (component.parentId) {
    const parent = diagram.components.find((c) => c.id === component.parentId);
    if (
      parent &&
      (parent.definitionId === 'subnet' ||
        parent.definitionId === 'public-subnet' ||
        parent.definitionId === 'private-subnet')
    ) {
      connectedSubnetIds.add(parent.id);
    }
  }

  return connectedSubnetIds.size;
}

// ─── Placement Rules ─────────────────────────────────────────────────────────

/**
 * Rule 1: EC2 must be placed inside a subnet.
 */
const rule1: PlacementRule = {
  id: 'ec2-in-subnet',
  description: 'EC2 must be placed inside a subnet',
  severity: 'error',
  validate: (component: CanvasComponentInstance, diagram: DiagramState): boolean => {
    if (component.definitionId !== 'ec2') return true;
    return isInsideAnySubnet(component, diagram);
  },
};

/**
 * Rule 2: Subnets must be inside a VPC.
 */
const rule2: PlacementRule = {
  id: 'subnet-in-vpc',
  description: 'Subnets must be inside a VPC',
  severity: 'error',
  validate: (component: CanvasComponentInstance, diagram: DiagramState): boolean => {
    if (
      component.definitionId !== 'subnet' &&
      component.definitionId !== 'public-subnet' &&
      component.definitionId !== 'private-subnet'
    ) {
      return true;
    }
    return isInsideContainerType(component, 'vpc', diagram);
  },
};

/**
 * Rule 3: IGW attaches to the VPC, not a subnet.
 * IGW should be inside a VPC directly, not inside a subnet.
 */
const rule3: PlacementRule = {
  id: 'igw-in-vpc',
  description: 'IGW attaches to the VPC, not a subnet',
  severity: 'error',
  validate: (component: CanvasComponentInstance, diagram: DiagramState): boolean => {
    if (component.definitionId !== 'igw') return true;
    // IGW must be directly inside a VPC (not inside a subnet)
    const parentDef = getParentDefinitionId(component, diagram);
    return parentDef === 'vpc';
  },
};

/**
 * Rule 4: S3 is a global service — place it outside the VPC.
 */
const rule4: PlacementRule = {
  id: 's3-outside-vpc',
  description: 'S3 is a global service — place it outside the VPC',
  severity: 'error',
  validate: (component: CanvasComponentInstance, diagram: DiagramState): boolean => {
    if (component.definitionId !== 's3') return true;
    return !isInsideVPC(component, diagram);
  },
};

/**
 * Rule 5: CloudFront is a global edge service — outside the VPC.
 */
const rule5: PlacementRule = {
  id: 'cloudfront-outside-vpc',
  description: 'CloudFront is a global edge service — outside the VPC',
  severity: 'error',
  validate: (component: CanvasComponentInstance, diagram: DiagramState): boolean => {
    if (component.definitionId !== 'cloudfront') return true;
    return !isInsideVPC(component, diagram);
  },
};

/**
 * Rule 6: Security Group must be attached to a resource.
 */
const rule6: PlacementRule = {
  id: 'sg-attached',
  description: 'Security Group must be attached to a resource',
  severity: 'error',
  validate: (component: CanvasComponentInstance, diagram: DiagramState): boolean => {
    if (component.definitionId !== 'security-group') return true;
    return isSecurityGroupAttached(component, diagram);
  },
};

/**
 * Rule 7: NAT Gateway should be in a public subnet.
 */
const rule7: PlacementRule = {
  id: 'nat-in-public-subnet',
  description: 'NAT Gateway should be in a public subnet',
  severity: 'warning',
  validate: (component: CanvasComponentInstance, diagram: DiagramState): boolean => {
    if (component.definitionId !== 'nat-gateway') return true;
    return isInsidePublicSubnet(component, diagram);
  },
};

/**
 * Rule 8: Databases in public subnets are a security risk.
 */
const rule8: PlacementRule = {
  id: 'rds-not-in-public-subnet',
  description: 'Databases in public subnets are a security risk',
  severity: 'warning',
  validate: (component: CanvasComponentInstance, diagram: DiagramState): boolean => {
    if (component.definitionId !== 'rds') return true;
    // Rule is satisfied if RDS is NOT in a public subnet
    return !isInsidePublicSubnet(component, diagram);
  },
};

/**
 * Rule 9: ALB requires subnets in at least 2 Availability Zones.
 */
const rule9: PlacementRule = {
  id: 'alb-multi-az',
  description: 'ALB requires subnets in at least 2 Availability Zones',
  severity: 'warning',
  validate: (component: CanvasComponentInstance, diagram: DiagramState): boolean => {
    if (component.definitionId !== 'alb') return true;
    return getALBSubnetCount(component, diagram) >= 2;
  },
};

/** All 9 placement rules in order */
const ALL_RULES: PlacementRule[] = [
  rule1,
  rule2,
  rule3,
  rule4,
  rule5,
  rule6,
  rule7,
  rule8,
  rule9,
];

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Validates a single component placement against all applicable rules.
 * Returns an array of ValidationResult for any violated rules.
 * An empty array means the placement is valid.
 */
export function validatePlacement(
  component: CanvasComponentInstance,
  diagram: DiagramState
): ValidationResult[] {
  const violations: ValidationResult[] = [];

  for (const rule of ALL_RULES) {
    const isValid = rule.validate(component, diagram);
    if (!isValid) {
      violations.push({
        ruleId: rule.id,
        severity: rule.severity,
        message: rule.description,
        affectedComponents: [component.id],
      });
    }
  }

  return violations;
}

/**
 * Validates all components in a diagram against all placement rules.
 * Returns an array of all ValidationResult violations across the entire diagram.
 * An empty array means the diagram has no violations.
 */
export function validateDiagram(diagram: DiagramState): ValidationResult[] {
  const violations: ValidationResult[] = [];

  for (const component of diagram.components) {
    const componentViolations = validatePlacement(component, diagram);
    violations.push(...componentViolations);
  }

  return violations;
}

/**
 * Returns the list of all 9 placement rules without the validate function.
 * Suitable for serialization and display in the UI.
 */
export function getPlacementRules(): Omit<PlacementRule, 'validate'>[] {
  return ALL_RULES.map(({ id, description, severity }) => ({
    id,
    description,
    severity,
  }));
}

/**
 * Determines whether a diagram can be submitted.
 * Returns true if there are no error-level violations.
 * Diagrams with only warning-level violations (or no violations) are submittable.
 */
export function canSubmit(diagram: DiagramState): boolean {
  const violations = validateDiagram(diagram);
  return !violations.some((v) => v.severity === 'error');
}
