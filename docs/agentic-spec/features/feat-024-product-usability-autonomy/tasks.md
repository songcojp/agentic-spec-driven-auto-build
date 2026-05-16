# FEAT-024 Product Usability Autonomy — Tasks

Feature ID: FEAT-024
Status: ready

## Task List

### T-024-01 Feature Spec and mainline index
Status: ready
Verification: `git diff --check`

### T-024-02 Protocol contracts and drift tests
Status: ready
Verification: `node --test tests/product-usability.test.ts`

### T-024-03 Product Usability Gate integration
Status: ready
Verification: `node --test tests/product-usability.test.ts tests/quality-gates.test.ts`

### T-024-04 ReviewItem and scheduler projection
Status: ready
Verification: `node --test tests/scheduler.test.ts tests/review-center.test.ts`

### T-024-05 Status checker and IDE view model projection
Status: ready
Verification: `node --test tests/status-checker.test.ts tests/specdrive-ide.test.ts`

### T-024-06 Execution Workbench evidence display
Status: ready
Verification: `node --test tests/specdrive-ide-webview-boundary.test.ts`; `npm run ide:build`

### T-024-07 Skill wrapper and ReferencePatternMap docs
Status: ready
Verification: `npm run skills:validate`; `git diff --check`

### T-024-08 Hybrid golden journey and closeout
Status: ready
Verification: `node --test tests/product-usability.test.ts tests/specdrive-ide.test.ts`; `npm run skills:validate`; `npm run ide:build`; `git diff --check`
