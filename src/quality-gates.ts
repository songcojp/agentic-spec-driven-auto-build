import type { ExecutionAdapterInvocationV1 } from "./execution-adapter-contracts.ts";
import type {
  DeliveryFidelityGate,
  GitDeliveryGate,
  JourneyClosureGate,
  SkillArtifactContract,
  SkillOutputContract,
} from "./cli-adapter.ts";
import { assessProductUsabilityGate, type ProductUsabilityGateInput } from "./product-usability.ts";

export type RuntimeEvidence = {
  appLaunch?: {
    command?: string;
    status?: string;
    url?: string;
    evidence?: string[];
  };
  journeys?: Array<Record<string, unknown>>;
  stateAssertions?: Array<Record<string, unknown>>;
  negativePaths?: Array<Record<string, unknown>>;
};

export type FeatureCompletionGateStatus = "completed" | "review_needed" | "blocked" | "failed";

export type FeatureCompletionGateResult = {
  status: FeatureCompletionGateStatus;
  reason?: string;
  triggers: string[];
  details: string[];
};

export type AppRuntimePolicy = {
  requireRuntimeEvidence?: boolean;
  appTouchedPatterns?: string[];
};

export function validateFeatureCompletion(input: {
  skillOutput?: SkillOutputContract;
  invocation?: ExecutionAdapterInvocationV1;
  changedFiles?: string[];
  expectedArtifacts?: SkillArtifactContract[];
  appRuntimePolicy?: AppRuntimePolicy;
}): FeatureCompletionGateResult {
  const output = input.skillOutput;
  const invocation = input.invocation;
  if (!invocation || !output || output.status !== "completed" || !isFeatureExecutionInvocation(invocation, output)) {
    return { status: "completed", triggers: [], details: [] };
  }

  const details: string[] = [];
  const triggers: string[] = [];

  if (output.contractVersion !== "skill-contract/v2") {
    triggers.push("quality_evidence_gap");
    details.push("Feature execution completed outputs must use skill-contract/v2 with deliveryFidelity.");
  }

  const journeyClosure = assessJourneyClosureGate(invocation, output);
  if (!journeyClosure.passed) {
    triggers.push(journeyClosure.reason ?? "journey_not_closed");
    details.push(`Journey Closure Gate failed: ${journeyClosure.reason ?? "journey_not_closed"}${journeyClosure.details.length ? ` (${journeyClosure.details.join("; ")})` : ""}.`);
  }

  const deliveryFidelity = assessDeliveryFidelityGate(invocation, output);
  if (!deliveryFidelity.passed) {
    triggers.push(deliveryFidelity.reason ?? "quality_evidence_gap");
    details.push(`Delivery Fidelity Gate failed: ${deliveryFidelity.reason ?? "quality_evidence_gap"}${deliveryFidelity.details.length ? ` (${deliveryFidelity.details.join("; ")})` : ""}.`);
  }

  const gitDelivery = assessGitDeliveryGate(invocation, output);
  if (!gitDelivery.passed) {
    triggers.push(gitDelivery.reason ?? "delivery_evidence_missing");
    details.push(`Git Delivery Gate failed: ${gitDelivery.reason ?? "delivery_evidence_missing"}${gitDelivery.details.length ? ` (${gitDelivery.details.join("; ")})` : ""}.`);
  }

  const runtimeEvidence = assessRuntimeEvidenceGate({
    invocation,
    output,
    changedFiles: input.changedFiles,
    policy: input.appRuntimePolicy,
  });
  if (!runtimeEvidence.passed) {
    triggers.push(runtimeEvidence.reason);
    details.push(`Runtime Evidence Gate failed: ${runtimeEvidence.reason}${runtimeEvidence.details.length ? ` (${runtimeEvidence.details.join("; ")})` : ""}.`);
  }

  const productUsability = assessProductUsabilityGate(asProductUsabilityGateInput(output.result.productUsability));
  if (!productUsability.passed) {
    triggers.push(productUsability.reason ?? "product_usability_gap");
    triggers.push(...productUsability.triggers);
    details.push(`Product Usability Gate failed: ${productUsability.details.join("; ")}.`);
  }

  if (details.length === 0) {
    return { status: "completed", triggers: [], details: ["Feature completion gates passed."] };
  }

  return {
    status: "review_needed",
    reason: triggers[0] ?? "quality_evidence_gap",
    triggers: unique(triggers),
    details,
  };
}

export function assessJourneyClosureGate(invocation: ExecutionAdapterInvocationV1 | undefined, output: SkillOutputContract | undefined): JourneyClosureGate {
  if (!invocation || !output || output.status !== "completed" || !isFeatureExecutionInvocation(invocation, output)) {
    return { passed: true, details: [] };
  }
  const result = output.result;
  const foundationExemption = isValidFoundationExemption(result.foundationExemption);
  const journeyEvidence = Array.isArray(result.journeyEvidence) ? result.journeyEvidence : [];
  const acceptanceEvidence = Array.isArray(result.acceptanceEvidence) ? result.acceptanceEvidence : [];
  const requirementCoverage = Array.isArray(result.requirementCoverage) ? result.requirementCoverage : [];
  if (foundationExemption) {
    return { passed: true, details: ["foundationExemption accepted"] };
  }
  const missing: string[] = [];
  if (journeyEvidence.length === 0) missing.push("journeyEvidence is required");
  if (acceptanceEvidence.length === 0) missing.push("acceptanceEvidence is required");
  if (requirementCoverage.length === 0) missing.push("requirementCoverage is required");
  if (missing.length > 0 && resultItemsMentionStructuredEvidence(result)) {
    missing.push("evidence was provided as text, but structured result arrays are required");
  }
  if (missing.length > 0) {
    return { passed: false, reason: "evidence_missing", details: missing };
  }
  const failedJourneys = journeyEvidence.filter((entry) => !isPassedEvidence(entry));
  const failedAcceptance = acceptanceEvidence.filter((entry) => !isPassedEvidence(entry));
  const failedRequirements = requirementCoverage.filter((entry) => !isPassedEvidence(entry));
  if (failedJourneys.length > 0) {
    return { passed: false, reason: "journey_not_closed", details: failedJourneys.map(describeEvidence) };
  }
  if (failedAcceptance.length > 0 || failedRequirements.length > 0) {
    return { passed: false, reason: "acceptance_gap", details: [...failedAcceptance, ...failedRequirements].map(describeEvidence) };
  }
  return { passed: true, details: ["journeyEvidence, acceptanceEvidence, and requirementCoverage passed"] };
}

export function assessDeliveryFidelityGate(invocation: ExecutionAdapterInvocationV1 | undefined, output: SkillOutputContract | undefined): DeliveryFidelityGate {
  if (!invocation || !output || output.status !== "completed" || !isFeatureExecutionInvocation(invocation, output)) {
    return { passed: true, details: [] };
  }
  const result = output.result;
  const deliveryFidelity = result.deliveryFidelity;
  if (typeof deliveryFidelity !== "object" || deliveryFidelity === null || Array.isArray(deliveryFidelity)) {
    return { passed: false, reason: "quality_evidence_gap", details: ["deliveryFidelity is required"] };
  }
  const ledger = deliveryFidelity as Record<string, unknown>;
  const missing: string[] = [];
  const sourceIntent = arrayFromRecordField(ledger, "sourceIntent");
  const behaviorObligations = arrayFromRecordField(ledger, "behaviorObligations");
  const handoffs = arrayFromRecordField(ledger, "handoffs");
  const evidence = arrayFromRecordField(ledger, "evidence");
  const agentReviews = arrayFromRecordField(ledger, "agentReviews");
  const losses = arrayFromRecordField(ledger, "losses");
  if (sourceIntent.length === 0) missing.push("sourceIntent is required");
  if (behaviorObligations.length === 0) missing.push("behaviorObligations is required");
  if (handoffs.length === 0) missing.push("handoffs are required");
  if (evidence.length === 0) missing.push("evidence is required");
  if (agentReviews.length === 0) missing.push("agentReviews are required");
  const completionDecision = ledger.completionDecision;
  if (typeof completionDecision !== "object" || completionDecision === null || Array.isArray(completionDecision)) {
    missing.push("completionDecision is required");
  }
  if (missing.length > 0) {
    return { passed: false, reason: "quality_evidence_gap", details: missing };
  }

  const openCriticalLosses = losses
    .filter(isRecord)
    .filter((entry) => ["P0", "P1"].includes(String(entry.severity)) && !isClosedLossStatus(entry.status))
    .map((entry) => `${entry.severity}:${entry.type}`);
  if (openCriticalLosses.length > 0) {
    return { passed: false, reason: "quality_evidence_gap", details: openCriticalLosses.map((entry) => `unclosed critical loss ${entry}`) };
  }

  const openP2Losses = losses
    .filter(isRecord)
    .filter((entry) => String(entry.severity) === "P2" && String(entry.status) === "open")
    .map((entry) => `${entry.severity}:${entry.type}`);
  if (openP2Losses.length > 0) {
    return { passed: false, reason: "quality_evidence_gap", details: openP2Losses.map((entry) => `P2 loss must be closed or deferred ${entry}`) };
  }

  const unverifiedObligations = behaviorObligations
    .filter(isRecord)
    .filter((entry) => !isPassedEvidence(entry) || !nonEmptyArray(entry.evidenceRefs))
    .map((entry) => String(entry.id ?? "unnamed obligation"));
  if (unverifiedObligations.length > 0) {
    return { passed: false, reason: "test_semantics_gap", details: unverifiedObligations.map((entry) => `behavior obligation lacks verification evidence: ${entry}`) };
  }

  const brokenHandoffs = handoffs
    .filter(isRecord)
    .filter((entry) => !isPassedEvidence(entry) || !nonEmptyArray(entry.preservedObligations))
    .map((entry) => `${String(entry.from ?? "unknown")} -> ${String(entry.to ?? "unknown")}`);
  if (brokenHandoffs.length > 0) {
    return { passed: false, reason: "quality_evidence_gap", details: brokenHandoffs.map((entry) => `handoff did not preserve obligations: ${entry}`) };
  }

  const evidenceRecords = evidence.filter(isRecord);
  const allFixtureOrSeeded = evidenceRecords.length > 0 && evidenceRecords.every((entry) => {
    const mode = String(entry.mode ?? "").toLowerCase();
    return mode === "fixture" || mode === "seed" || mode === "seeded" || mode === "seed_fixture";
  });
  if (allFixtureOrSeeded) {
    return { passed: false, reason: "journey_bypassed_by_fixture", details: ["evidence cannot be only seed or fixture based"] };
  }
  const allEntryOnly = evidenceRecords.length > 0 && evidenceRecords.every((entry) => {
    const assertion = String(entry.assertion ?? "").toLowerCase();
    return assertion.includes("entry") || assertion.includes("text_presence") || assertion.includes("page_presence");
  });
  if (allEntryOnly) {
    return { passed: false, reason: "test_semantics_gap", details: ["evidence cannot only assert entry or text presence"] };
  }
  const missingEvidenceArtifacts = evidenceRecords
    .filter((entry) => !isPassedEvidence(entry) || !nonEmptyArray(entry.covers) || !nonEmptyArray(entry.artifactRefs))
    .map((entry) => String(entry.id ?? "unnamed evidence"));
  if (missingEvidenceArtifacts.length > 0) {
    return { passed: false, reason: "quality_evidence_gap", details: missingEvidenceArtifacts.map((entry) => `evidence row lacks covers/artifacts or did not pass: ${entry}`) };
  }

  const hasIndependentReview = agentReviews
    .filter(isRecord)
    .some((entry) => {
      const role = String(entry.role ?? "").toLowerCase();
      return isPassedEvidence(entry)
        && (role.includes("test") || role.includes("qa") || role.includes("review") || role.includes("release"))
        && !role.includes("implementation");
    });
  if (!hasIndependentReview) {
    return { passed: false, reason: "quality_evidence_gap", details: ["independent Test/QA/Review/Release agent review is required"] };
  }

  const decision = completionDecision as Record<string, unknown>;
  if (!isPassedEvidence(decision) || !nonEmptyString(decision.decidedBy)) {
    return { passed: false, reason: "quality_evidence_gap", details: ["completionDecision must be passed and name the deciding role"] };
  }
  return { passed: true, details: ["deliveryFidelity ledger passed"] };
}

export function assessGitDeliveryGate(invocation: ExecutionAdapterInvocationV1 | undefined, output: SkillOutputContract | undefined): GitDeliveryGate {
  if (!invocation || !output || output.status !== "completed" || !isFeatureExecutionInvocation(invocation, output)) {
    return { passed: true, details: [] };
  }
  const result = output.result;
  const gitDelivery = result.gitDelivery;
  if (typeof gitDelivery !== "object" || gitDelivery === null || Array.isArray(gitDelivery)) {
    return { passed: false, reason: "delivery_evidence_missing", details: ["gitDelivery is required"] };
  }
  const record = gitDelivery as Record<string, unknown>;
  if (isValidDeliveryExemption(record.deliveryExemption)) {
    return { passed: true, details: ["deliveryExemption accepted"] };
  }

  const missing: string[] = [];
  for (const field of ["ownerWorkspace", "implementationWorkspace", "worktree", "branch", "commitHash", "prUrl"]) {
    if (!nonEmptyString(record[field])) missing.push(`${field} is required`);
  }
  for (const field of ["checks", "merge", "remoteBranchCleanup", "localBranchCleanup", "worktreeCleanup"]) {
    if (!isPassedDeliveryStatus(record[field])) missing.push(`${field} must be passed, completed, cleaned, or merged`);
  }
  if (missing.length > 0) {
    const reason = missing.some((entry) => entry.includes("must be")) ? "delivery_not_closed" : "delivery_evidence_missing";
    return { passed: false, reason, details: missing };
  }
  return { passed: true, details: ["worktree, PR, merge, and cleanup evidence passed"] };
}

export function assessRuntimeEvidenceGate(input: {
  invocation?: ExecutionAdapterInvocationV1;
  output?: SkillOutputContract;
  changedFiles?: string[];
  policy?: AppRuntimePolicy;
}): { passed: true; details: string[] } | { passed: false; reason: "evidence_missing"; details: string[] } {
  const { invocation, output } = input;
  if (!invocation || !output || output.status !== "completed" || !isFeatureExecutionInvocation(invocation, output)) {
    return { passed: true, details: [] };
  }
  const result = output.result;
  if (isValidFoundationExemption(result.foundationExemption) || isValidRuntimeExemption(result.runtimeExemption)) {
    return { passed: true, details: ["runtime exemption accepted"] };
  }
  const changedFiles = input.changedFiles?.length
    ? input.changedFiles
    : [
        ...invocation.skillInstruction.sourcePaths,
        ...output.producedArtifacts.map((artifact) => artifact.path),
      ];
  const requiresRuntime = input.policy?.requireRuntimeEvidence === true || changedFiles.some((file) => isAppTouchingFile(file, input.policy?.appTouchedPatterns));
  if (!requiresRuntime) return { passed: true, details: ["runtime evidence not required"] };

  const runtimeEvidence = asRecord(result.runtimeEvidence);
  if (!runtimeEvidence) {
    return { passed: false, reason: "evidence_missing", details: ["runtimeEvidence is required for UI/app changes"] };
  }
  const missing: string[] = [];
  const appLaunch = asRecord(runtimeEvidence.appLaunch);
  if (!appLaunch || !isPassedEvidence(appLaunch) || !nonEmptyArray(appLaunch.evidence)) {
    missing.push("runtimeEvidence.appLaunch must pass and include evidence refs");
  }
  if (!hasPassedEvidenceRow(runtimeEvidence.journeys)) missing.push("runtimeEvidence.journeys requires at least one passed journey");
  if (!hasPassedEvidenceRow(runtimeEvidence.stateAssertions)) missing.push("runtimeEvidence.stateAssertions requires at least one passed state assertion");
  if (!hasPassedEvidenceRow(runtimeEvidence.negativePaths)) missing.push("runtimeEvidence.negativePaths requires at least one passed negative or boundary path");
  if (missing.length > 0) return { passed: false, reason: "evidence_missing", details: missing };
  return { passed: true, details: ["runtime evidence passed"] };
}

export function isFeatureExecutionInvocation(invocation: ExecutionAdapterInvocationV1, output: SkillOutputContract): boolean {
  return invocation.operation === "feature_execution"
    || invocation.skillInstruction.requestedAction === "feature_execution"
    || output.requestedAction === "feature_execution"
    || output.skillName === "implement-feature";
}

export function isAppTouchingFile(file: string, extraPatterns: string[] = []): boolean {
  const normalized = file.replaceAll("\\", "/");
  return [
    /^apps\//,
    /^src\/pages\//,
    /^src\/components\//,
    /^src\/routes\//,
    /^src\/app\//,
    /^src\/ui\//,
    /\.(tsx|jsx|vue|svelte)$/,
    ...extraPatterns.map(globToRegExp),
  ].some((pattern) => pattern.test(normalized));
}

function hasPassedEvidenceRow(value: unknown): boolean {
  return Array.isArray(value) && value.some((entry) => isPassedEvidence(entry) && evidenceRefs(entry).length > 0);
}

function evidenceRefs(value: unknown): unknown[] {
  const record = asRecord(value);
  if (!record) return [];
  for (const field of ["evidence", "artifactRefs", "evidenceRefs", "artifacts"]) {
    if (Array.isArray(record[field])) return record[field];
  }
  return [];
}

function resultItemsMentionStructuredEvidence(result: Record<string, unknown>): boolean {
  const items = Array.isArray(result.items) ? result.items : [];
  return items.some((entry) => {
    const text = String(entry).toLowerCase();
    return text.includes("journeyevidence")
      || text.includes("acceptanceevidence")
      || text.includes("requirementcoverage");
  });
}

function arrayFromRecordField(record: Record<string, unknown>, field: string): unknown[] {
  const value = record[field];
  return Array.isArray(value) ? value : [];
}

function asProductUsabilityGateInput(value: unknown): ProductUsabilityGateInput | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  const invalidFields: string[] = [];
  return {
    priorityStories: productUsabilityArrayField(record, "priorityStories", invalidFields)?.map(String) ?? [],
    decisionLog: (productUsabilityArrayField(record, "decisionLog", invalidFields) as ProductUsabilityGateInput["decisionLog"] | undefined) ?? [],
    skillWrapperContracts: productUsabilityArrayField(record, "skillWrapperContracts", invalidFields) as ProductUsabilityGateInput["skillWrapperContracts"] | undefined,
    protocolGaps: (productUsabilityArrayField(record, "protocolGaps", invalidFields) as ProductUsabilityGateInput["protocolGaps"] | undefined) ?? [],
    usabilityEvidence: (productUsabilityArrayField(record, "usabilityEvidence", invalidFields) as ProductUsabilityGateInput["usabilityEvidence"] | undefined) ?? [],
    lifecycleHandoffs: (productUsabilityArrayField(record, "lifecycleHandoffs", invalidFields) as ProductUsabilityGateInput["lifecycleHandoffs"] | undefined) ?? [],
    referencePatternMap: (productUsabilityArrayField(record, "referencePatternMap", invalidFields) as ProductUsabilityGateInput["referencePatternMap"] | undefined) ?? [],
    invalidFields,
  };
}

function productUsabilityArrayField(record: Record<string, unknown>, field: string, invalidFields: string[]): unknown[] | undefined {
  if (!(field in record)) return undefined;
  const value = record[field];
  if (Array.isArray(value)) return value;
  invalidFields.push(field);
  return undefined;
}

function isValidFoundationExemption(value: unknown): boolean {
  const record = asRecord(value);
  if (!record || record.exempt !== true) return false;
  return nonEmptyString(record.reason)
    && nonEmptyArray(record.downstreamFeatures)
    && nonEmptyArray(record.integrationEvidence);
}

function isValidRuntimeExemption(value: unknown): boolean {
  const record = asRecord(value);
  if (!record || record.exempt !== true) return false;
  return nonEmptyString(record.reason) && nonEmptyArray(record.evidence);
}

function isValidDeliveryExemption(value: unknown): boolean {
  const record = asRecord(value);
  if (!record || record.approved !== true) return false;
  return nonEmptyString(record.reason) && nonEmptyArray(record.evidence);
}

function isClosedLossStatus(value: unknown): boolean {
  const status = String(value ?? "").toLowerCase();
  return status === "closed" || status === "deferred" || status === "accepted";
}

function isPassedDeliveryStatus(value: unknown): boolean {
  const record = asRecord(value);
  const status = record ? String(record.status ?? "").toLowerCase() : String(value ?? "").toLowerCase();
  return ["passed", "complete", "completed", "cleaned", "merged", "success", "succeeded"].includes(status);
}

function isPassedEvidence(value: unknown): boolean {
  const record = asRecord(value);
  if (!record) return false;
  const status = String(record.status ?? "").toLowerCase();
  return ["passed", "complete", "completed", "covered", "verified"].includes(status);
}

function describeEvidence(value: unknown): string {
  const record = asRecord(value);
  if (!record) return "unknown evidence";
  return String(record.userStoryId ?? record.requirementId ?? record.check ?? record.scenario ?? record.id ?? "unnamed evidence");
}

function nonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function nonEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function globToRegExp(glob: string): RegExp {
  const globStar = "__AUTOBUILD_GLOBSTAR__";
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, globStar)
    .replace(/\*/g, "[^/]*")
    .replaceAll(globStar, ".*");
  return new RegExp(`^${escaped}$`);
}
