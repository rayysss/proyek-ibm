/**
 * TestFlow – script.js
 * Web-Based Test Case Generator & Management System
 *
 * Architecture:
 *   1. Storage     – LocalStorage read/write helpers
 *   2. Generator   – Build test cases from user requirements
 *   3. CRUD        – Create / Read / Update / Delete operations
 *   4. UI Render   – Dashboard, Table, Execution, Export sections
 *   5. Filters     – Search + filter logic
 *   6. Modal       – Add/Edit modal & Detail modal
 *   7. Export      – CSV export
 *   8. Navigation  – Sidebar section switching
 *   9. Init        – Bootstrap on DOMContentLoaded
 */

'use strict';

/* ══════════════════════════════════════════════════
   1. STORAGE
══════════════════════════════════════════════════ */

const STORAGE_KEY = 'testflow_cases';

/** @returns {TestCase[]} */
function storageLoad() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

/** @param {TestCase[]} cases */
function storageSave(cases) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
}

/* ══════════════════════════════════════════════════
   2. GENERATOR ENGINE
══════════════════════════════════════════════════ */

/**
 * Generate a unique Test Case ID.
 * Format: TC-YYYYMMDD-XXXX
 */
let _idCounter = Date.now();
function generateId() {
  _idCounter++;
  const d = new Date();
  const datePart = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return `TC-${datePart}-${String(_idCounter).slice(-4)}`;
}

/**
 * Core generator: produces structured test cases for 4 categories
 * based on user-provided requirement fields.
 *
 * @param {{ module, description, precondition, testData, expected }} input
 * @returns {TestCase[]}
 */
function generateTestCases(input) {
  const { module, description, precondition, testData, expected } = input;
  const now = new Date().toISOString();
  const pre = precondition ? `Precondition: ${precondition}` : '';

  /** Helper – build step array as a newline-joined string */
  const steps = (...lines) => lines.filter(Boolean).join('\n');

  const cases = [];

  /* ── POSITIVE TESTING ── */
  cases.push({
    id: generateId(),
    scenario: `Verify that ${module} works correctly with valid inputs`,
    steps: steps(
      pre,
      `1. Navigate to the ${module} interface`,
      `2. Ensure all preconditions are met`,
      `3. Enter valid test data: ${testData || 'standard valid values'}`,
      `4. Execute the ${module} operation`,
      `5. Observe the system response`
    ),
    testData: testData || 'Valid, well-formed input data',
    expected: expected,
    type: 'Positive',
    priority: 'High',
    status: 'Not Run',
    createdAt: now,
    module,
    description,
  });

  cases.push({
    id: generateId(),
    scenario: `Verify ${module} completes successfully with all required fields filled`,
    steps: steps(
      pre,
      `1. Open the ${module} feature`,
      `2. Fill in all required fields with valid data`,
      `3. Submit / trigger the ${module} action`,
      `4. Verify success response`
    ),
    testData: testData || 'All required fields populated',
    expected: `${expected} and no errors are displayed`,
    type: 'Positive',
    priority: 'High',
    status: 'Not Run',
    createdAt: now,
    module,
    description,
  });

  /* ── NEGATIVE TESTING ── */
  cases.push({
    id: generateId(),
    scenario: `Verify that ${module} shows an error when invalid data is provided`,
    steps: steps(
      pre,
      `1. Navigate to the ${module} interface`,
      `2. Enter invalid or malformed input data`,
      `3. Attempt to execute the ${module} operation`,
      `4. Observe system behavior and error messages`
    ),
    testData: 'Invalid / malformed input (e.g., wrong format, special characters)',
    expected: `System displays a clear error message and does not proceed`,
    type: 'Negative',
    priority: 'High',
    status: 'Not Run',
    createdAt: now,
    module,
    description,
  });

  cases.push({
    id: generateId(),
    scenario: `Verify ${module} handles empty required fields appropriately`,
    steps: steps(
      pre,
      `1. Open the ${module} feature`,
      `2. Leave all required fields empty`,
      `3. Attempt to submit / execute the operation`,
      `4. Check for validation feedback`
    ),
    testData: 'Empty fields / no input provided',
    expected: `System displays a validation error for each empty required field`,
    type: 'Negative',
    priority: 'Medium',
    status: 'Not Run',
    createdAt: now,
    module,
    description,
  });

  cases.push({
    id: generateId(),
    scenario: `Verify ${module} rejects SQL injection / script injection attempts`,
    steps: steps(
      pre,
      `1. Navigate to the ${module} input fields`,
      `2. Enter injection payload: \`' OR '1'='1\` or \`<script>alert(1)</script>\``,
      `3. Submit the form`,
      `4. Verify system response`
    ),
    testData: `SQL/Script injection strings`,
    expected: `System sanitizes input and returns an error without executing injected code`,
    type: 'Negative',
    priority: 'High',
    status: 'Not Run',
    createdAt: now,
    module,
    description,
  });

  /* ── BOUNDARY VALUE TESTING ── */
  cases.push({
    id: generateId(),
    scenario: `Verify ${module} behavior at minimum acceptable input value`,
    steps: steps(
      pre,
      `1. Open the ${module} feature`,
      `2. Enter the minimum allowed value for the input field`,
      `3. Submit / execute the operation`,
      `4. Observe result`
    ),
    testData: `Minimum boundary value (e.g., 1 character, 0, or defined lower limit)`,
    expected: `System accepts minimum value and ${expected}`,
    type: 'Boundary',
    priority: 'Medium',
    status: 'Not Run',
    createdAt: now,
    module,
    description,
  });

  cases.push({
    id: generateId(),
    scenario: `Verify ${module} behavior at maximum acceptable input value`,
    steps: steps(
      pre,
      `1. Open the ${module} feature`,
      `2. Enter the maximum allowed value for the input field`,
      `3. Submit / execute the operation`,
      `4. Observe result`
    ),
    testData: `Maximum boundary value (e.g., 255 characters, max integer, upper limit)`,
    expected: `System accepts maximum value and ${expected}`,
    type: 'Boundary',
    priority: 'Medium',
    status: 'Not Run',
    createdAt: now,
    module,
    description,
  });

  cases.push({
    id: generateId(),
    scenario: `Verify ${module} rejects input that exceeds the maximum boundary`,
    steps: steps(
      pre,
      `1. Open the ${module} feature`,
      `2. Enter a value exceeding the allowed maximum`,
      `3. Submit / execute`,
      `4. Observe system response`
    ),
    testData: `Value beyond maximum limit (max + 1 or overflow value)`,
    expected: `System rejects the input and displays an appropriate validation message`,
    type: 'Boundary',
    priority: 'Medium',
    status: 'Not Run',
    createdAt: now,
    module,
    description,
  });

  /* ── VALIDATION TESTING ── */
  cases.push({
    id: generateId(),
    scenario: `Verify ${module} enforces correct format/pattern validation`,
    steps: steps(
      pre,
      `1. Open the ${module} feature`,
      `2. Enter data with an incorrect format (e.g., wrong email, wrong date format)`,
      `3. Attempt to submit`,
      `4. Check validation messages`
    ),
    testData: `Incorrectly formatted data (wrong pattern)`,
    expected: `System displays a format validation error with guidance on correct format`,
    type: 'Validation',
    priority: 'High',
    status: 'Not Run',
    createdAt: now,
    module,
    description,
  });

  cases.push({
    id: generateId(),
    scenario: `Verify ${module} enforces required field rules`,
    steps: steps(
      pre,
      `1. Open the ${module} interface`,
      `2. Identify all mandatory fields`,
      `3. Attempt submission without filling mandatory fields`,
      `4. Verify all required field errors are shown`
    ),
    testData: `Required fields left empty`,
    expected: `All required fields display validation messages; form not submitted`,
    type: 'Validation',
    priority: 'High',
    status: 'Not Run',
    createdAt: now,
    module,
    description,
  });

  cases.push({
    id: generateId(),
    scenario: `Verify ${module} validates data type constraints (numeric, alpha, etc.)`,
    steps: steps(
      pre,
      `1. Open the ${module} feature`,
      `2. Enter data of wrong type (e.g., text in numeric field, numbers in name field)`,
      `3. Submit the form`,
      `4. Observe validation messages`
    ),
    testData: `Wrong data type (e.g., "abc" in numeric field)`,
    expected: `System rejects incorrect data type with a descriptive validation message`,
    type: 'Validation',
    priority: 'Medium',
    status: 'Not Run',
    createdAt: now,
    module,
    description,
  });

  return cases;
}

/* ══════════════════════════════════════════════════
   3. CRUD OPERATIONS
══════════════════════════════════════════════════ */

function crudGetAll() {
  return storageLoad();
}

function crudSave(tc) {
  const all = storageLoad();
  all.push(tc);
  storageSave(all);
}

function crudSaveMany(tcs) {
  const all = storageLoad();
  tcs.forEach(tc => all.push(tc));
  storageSave(all);
}

function crudUpdate(id, patch) {
  const all = storageLoad();
  const idx = all.findIndex(t => t.id === id);
  if (idx === -1) return false;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  storageSave(all);
  return true;
}

function crudDelete(id) {
  const all = storageLoad().filter(t => t.id !== id);
  storageSave(all);
}

function crudFindById(id) {
  return storageLoad().find(t => t.id === id) || null;
}

/* ══════════════════════════════════════════════════
   4. UI RENDER HELPERS
══════════════════════════════════════════════════ */

/** Map type → CSS badge class */
const TYPE_BADGE = {
  Positive:   'badge-positive',
  Negative:   'badge-negative',
  Boundary:   'badge-boundary',
  Validation: 'badge-validation',
};

/** Map priority → CSS badge class */
const PRIORITY_BADGE = {
  High:   'badge-high',
  Medium: 'badge-medium',
  Low:    'badge-low',
};

/** Map status → CSS badge class */
const STATUS_BADGE = {
  Pass:     'badge-pass',
  Fail:     'badge-fail',
  'Not Run':'badge-notrun',
  Blocked:  'badge-blocked',
};

/** Map type → color for card bar */
const TYPE_COLOR = {
  Positive:   '#16A34A',
  Negative:   '#DC2626',
  Boundary:   '#2563EB',
  Validation: '#D97706',
};

function badge(text, cls) {
  return `<span class="badge ${cls}">${escHtml(text)}</span>`;
}

/** Escape HTML to prevent XSS in dynamic content */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Dashboard ── */
function renderDashboard() {
  const all = crudGetAll();
  const total   = all.length;
  const passed  = all.filter(t => t.status === 'Pass').length;
  const failed  = all.filter(t => t.status === 'Fail').length;
  const notRun  = all.filter(t => t.status === 'Not Run').length;
  const blocked = all.filter(t => t.status === 'Blocked').length;

  document.getElementById('statTotal').textContent  = total;
  document.getElementById('statPassed').textContent = passed;
  document.getElementById('statFailed').textContent = failed;
  document.getElementById('statNotRun').textContent = notRun;
  document.getElementById('totalBadge').textContent = `${total} Test Case${total !== 1 ? 's' : ''}`;

  // Progress bar
  const pPass    = total ? (passed  / total * 100).toFixed(1) : 0;
  const pFail    = total ? (failed  / total * 100).toFixed(1) : 0;
  const pBlocked = total ? (blocked / total * 100).toFixed(1) : 0;
  document.getElementById('progressPass').style.width    = pPass    + '%';
  document.getElementById('progressFail').style.width    = pFail    + '%';
  document.getElementById('progressBlocked').style.width = pBlocked + '%';

  // Type breakdown
  const types = ['Positive','Negative','Boundary','Validation'];
  const tbEl = document.getElementById('typeBreakdown');
  tbEl.innerHTML = types.map(t => {
    const cnt = all.filter(tc => tc.type === t).length;
    return `
      <div class="rounded-xl border border-slate-200 p-3 text-center">
        <p class="text-xl font-bold text-slate-800">${cnt}</p>
        <p class="text-xs text-slate-500 mt-0.5">${t}</p>
      </div>`;
  }).join('');
}

/* ── Management Table ── */
function renderManagementTable(filtered) {
  const all = filtered !== undefined ? filtered : applyFilters(crudGetAll());
  const tbody = document.getElementById('testCaseTableBody');
  const empty = document.getElementById('emptyManagement');
  const count = document.getElementById('managementCount');

  if (all.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    count.textContent = '';
    return;
  }

  empty.classList.add('hidden');
  count.textContent = `Showing ${all.length} test case${all.length !== 1 ? 's' : ''}`;

  tbody.innerHTML = all.map(tc => `
    <tr data-id="${escHtml(tc.id)}">
      <td class="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">${escHtml(tc.id)}</td>
      <td class="px-4 py-3 max-w-xs">
        <p class="font-medium text-slate-700 text-sm truncate-2">${escHtml(tc.scenario)}</p>
        ${tc.module ? `<p class="text-xs text-slate-400 mt-0.5">${escHtml(tc.module)}</p>` : ''}
      </td>
      <td class="px-4 py-3 whitespace-nowrap">${badge(tc.type, TYPE_BADGE[tc.type] || 'badge-notrun')}</td>
      <td class="px-4 py-3 whitespace-nowrap">${badge(tc.priority, PRIORITY_BADGE[tc.priority] || 'badge-low')}</td>
      <td class="px-4 py-3 whitespace-nowrap">${badge(tc.status, STATUS_BADGE[tc.status] || 'badge-notrun')}</td>
      <td class="px-4 py-3 whitespace-nowrap">
        <div class="flex items-center gap-1">
          <button class="btn-icon text-slate-500 hover:text-primary action-view" data-id="${escHtml(tc.id)}" title="View">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </button>
          <button class="btn-icon text-slate-500 hover:text-primary action-edit" data-id="${escHtml(tc.id)}" title="Edit">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button class="btn-icon text-slate-500 hover:text-red-500 action-delete" data-id="${escHtml(tc.id)}" title="Delete">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

/* ── Execution Cards ── */
function renderExecutionCards() {
  const all = crudGetAll();
  const container = document.getElementById('executionCards');
  const empty     = document.getElementById('emptyExecution');

  if (all.length === 0) {
    container.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  container.innerHTML = all.map(tc => `
    <div class="execution-card" data-id="${escHtml(tc.id)}">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-mono text-slate-400">${escHtml(tc.id)}</span>
            ${badge(tc.type, TYPE_BADGE[tc.type] || 'badge-notrun')}
            ${badge(tc.priority, PRIORITY_BADGE[tc.priority] || 'badge-low')}
          </div>
          <p class="text-sm font-semibold text-slate-700 mt-1.5">${escHtml(tc.scenario)}</p>
          <p class="text-xs text-slate-400 mt-1 line-clamp-1">${escHtml(tc.expected)}</p>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <select class="status-select ${statusSelectClass(tc.status)} exec-status-select" data-id="${escHtml(tc.id)}">
            <option value="Not Run" ${tc.status==='Not Run'?'selected':''}>Not Run</option>
            <option value="Pass"    ${tc.status==='Pass'   ?'selected':''}>Pass</option>
            <option value="Fail"    ${tc.status==='Fail'   ?'selected':''}>Fail</option>
            <option value="Blocked" ${tc.status==='Blocked'?'selected':''}>Blocked</option>
          </select>
        </div>
      </div>
      <div class="mt-3 pt-3 border-t border-slate-100">
        <p class="text-xs text-slate-500 font-semibold mb-1">Test Steps</p>
        <pre class="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">${escHtml(tc.steps)}</pre>
      </div>
    </div>
  `).join('');
}

function statusSelectClass(status) {
  const map = { Pass: 's-pass', Fail: 's-fail', Blocked: 's-blocked', 'Not Run': 's-notrun' };
  return map[status] || 's-notrun';
}

/* ── Export Summary Table ── */
function renderExportSummary() {
  const all = crudGetAll();
  const types = ['Positive','Negative','Boundary','Validation'];
  const statuses = ['Pass','Fail','Not Run','Blocked'];

  document.getElementById('exportTotalCount').textContent = all.length;
  document.getElementById('exportFailCount').textContent  = all.filter(t=>t.status==='Fail').length;

  const tbody = document.getElementById('exportSummaryTable');
  tbody.innerHTML = types.map(type => {
    const tcs = all.filter(t => t.type === type);
    const total = tcs.length;
    const pass    = tcs.filter(t=>t.status==='Pass').length;
    const fail    = tcs.filter(t=>t.status==='Fail').length;
    const notRun  = tcs.filter(t=>t.status==='Not Run').length;
    const blocked = tcs.filter(t=>t.status==='Blocked').length;
    return `
      <tr class="border-b border-slate-100 hover:bg-slate-50 text-sm">
        <td class="px-4 py-2.5">${badge(type, TYPE_BADGE[type])}</td>
        <td class="px-4 py-2.5 text-center font-semibold text-slate-700">${total}</td>
        <td class="px-4 py-2.5 text-center text-green-600 font-medium">${pass}</td>
        <td class="px-4 py-2.5 text-center text-red-500 font-medium">${fail}</td>
        <td class="px-4 py-2.5 text-center text-slate-500">${notRun}</td>
        <td class="px-4 py-2.5 text-center text-orange-500">${blocked}</td>
      </tr>`;
  }).join('');
}

/* ── Refresh all rendered sections ── */
function refreshAll() {
  renderDashboard();
  renderManagementTable();
  renderExecutionCards();
  renderExportSummary();
}

/* ══════════════════════════════════════════════════
   5. FILTERS
══════════════════════════════════════════════════ */

/**
 * Apply current filter inputs to an array of test cases.
 * @param {TestCase[]} all
 * @returns {TestCase[]}
 */
function applyFilters(all) {
  const search   = (document.getElementById('searchInput')?.value  || '').toLowerCase().trim();
  const type     = document.getElementById('filterType')?.value    || '';
  const priority = document.getElementById('filterPriority')?.value|| '';
  const status   = document.getElementById('filterStatus')?.value  || '';

  return all.filter(tc => {
    const matchSearch = !search ||
      tc.scenario.toLowerCase().includes(search)  ||
      tc.id.toLowerCase().includes(search)        ||
      (tc.module && tc.module.toLowerCase().includes(search)) ||
      (tc.description && tc.description.toLowerCase().includes(search));

    const matchType     = !type     || tc.type     === type;
    const matchPriority = !priority || tc.priority === priority;
    const matchStatus   = !status   || tc.status   === status;

    return matchSearch && matchType && matchPriority && matchStatus;
  });
}

function bindFilterEvents() {
  ['searchInput','filterType','filterPriority','filterStatus'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => renderManagementTable());
  });

  document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
    document.getElementById('searchInput').value   = '';
    document.getElementById('filterType').value    = '';
    document.getElementById('filterPriority').value = '';
    document.getElementById('filterStatus').value  = '';
    renderManagementTable();
  });
}

/* ══════════════════════════════════════════════════
   6. MODAL: ADD / EDIT
══════════════════════════════════════════════════ */

let _currentDetailId = null;  // for detail modal
let _pendingDeleteId  = null;  // for delete confirmation

/* ── Open Add Modal ── */
function openAddModal() {
  document.getElementById('modalTitle').textContent  = 'Add Test Case';
  document.getElementById('modalSaveBtn').textContent = 'Save Test Case';
  document.getElementById('modalId').value       = '';
  document.getElementById('modalScenario').value = '';
  document.getElementById('modalType').value     = '';
  document.getElementById('modalSteps').value    = '';
  document.getElementById('modalData').value     = '';
  document.getElementById('modalExpected').value = '';
  document.getElementById('modalPriority').value = 'Medium';
  document.getElementById('modalStatus').value   = 'Not Run';
  clearModalErrors();
  showOverlay('modalOverlay');
}

/* ── Open Edit Modal ── */
function openEditModal(id) {
  const tc = crudFindById(id);
  if (!tc) return;
  document.getElementById('modalTitle').textContent   = 'Edit Test Case';
  document.getElementById('modalSaveBtn').textContent = 'Update Test Case';
  document.getElementById('modalId').value       = tc.id;
  document.getElementById('modalScenario').value = tc.scenario;
  document.getElementById('modalType').value     = tc.type;
  document.getElementById('modalSteps').value    = tc.steps;
  document.getElementById('modalData').value     = tc.testData || '';
  document.getElementById('modalExpected').value = tc.expected;
  document.getElementById('modalPriority').value = tc.priority;
  document.getElementById('modalStatus').value   = tc.status;
  clearModalErrors();
  showOverlay('modalOverlay');
}

/* ── Modal Form Submit ── */
function handleModalSubmit(e) {
  e.preventDefault();
  if (!validateModalForm()) return;

  const id       = document.getElementById('modalId').value;
  const scenario = document.getElementById('modalScenario').value.trim();
  const type     = document.getElementById('modalType').value;
  const steps    = document.getElementById('modalSteps').value.trim();
  const testData = document.getElementById('modalData').value.trim();
  const expected = document.getElementById('modalExpected').value.trim();
  const priority = document.getElementById('modalPriority').value;
  const status   = document.getElementById('modalStatus').value;

  if (id) {
    // Update existing
    crudUpdate(id, { scenario, type, steps, testData, expected, priority, status });
    showToast('✏️  Test case updated successfully', 'success');
  } else {
    // Create new
    const tc = {
      id: generateId(),
      scenario, type, steps, testData, expected, priority, status,
      createdAt: new Date().toISOString(),
      module: '',
      description: '',
    };
    crudSave(tc);
    showToast('✅  Test case added successfully', 'success');
  }

  hideOverlay('modalOverlay');
  refreshAll();
}

function validateModalForm() {
  let valid = true;
  const required = [
    { id: 'modalScenario', errId: 'errModalScenario' },
    { id: 'modalType',     errId: 'errModalType'     },
    { id: 'modalSteps',    errId: 'errModalSteps'    },
    { id: 'modalExpected', errId: 'errModalExpected' },
  ];
  required.forEach(({ id, errId }) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    if (!el.value.trim()) {
      el.classList.add('is-error');
      err.classList.remove('hidden');
      valid = false;
    } else {
      el.classList.remove('is-error');
      err.classList.add('hidden');
    }
  });
  return valid;
}

function clearModalErrors() {
  ['modalScenario','modalType','modalSteps','modalExpected'].forEach(id => {
    document.getElementById(id)?.classList.remove('is-error');
  });
  ['errModalScenario','errModalType','errModalSteps','errModalExpected'].forEach(id => {
    document.getElementById(id)?.classList.add('hidden');
  });
}

/* ── Detail Modal ── */
function openDetailModal(id) {
  const tc = crudFindById(id);
  if (!tc) return;
  _currentDetailId = id;

  document.getElementById('detailTitle').textContent = escHtml(tc.id);

  const fields = [
    { label: 'ID',          value: tc.id },
    { label: 'Scenario',    value: tc.scenario },
    { label: 'Module',      value: tc.module || '–' },
    { label: 'Type',        value: tc.type },
    { label: 'Priority',    value: tc.priority },
    { label: 'Status',      value: tc.status },
    { label: 'Test Steps',  value: tc.steps },
    { label: 'Test Data',   value: tc.testData || '–' },
    { label: 'Expected',    value: tc.expected },
    { label: 'Description', value: tc.description || '–' },
    { label: 'Created',     value: tc.createdAt ? new Date(tc.createdAt).toLocaleString() : '–' },
  ];

  document.getElementById('detailContent').innerHTML = fields.map(f => `
    <div class="detail-row">
      <span class="detail-label">${escHtml(f.label)}</span>
      <span class="detail-value">${escHtml(f.value)}</span>
    </div>
  `).join('');

  showOverlay('detailOverlay');
}

/* ── Copy Detail ── */
function copyDetail() {
  if (!_currentDetailId) return;
  const tc = crudFindById(_currentDetailId);
  if (!tc) return;

  const text = [
    `Test Case ID  : ${tc.id}`,
    `Scenario      : ${tc.scenario}`,
    `Module        : ${tc.module || '–'}`,
    `Type          : ${tc.type}`,
    `Priority      : ${tc.priority}`,
    `Status        : ${tc.status}`,
    `Test Steps    :\n${tc.steps}`,
    `Test Data     : ${tc.testData || '–'}`,
    `Expected      : ${tc.expected}`,
  ].join('\n');

  navigator.clipboard.writeText(text)
    .then(() => showToast('📋  Test case copied to clipboard', 'info'))
    .catch(() => showToast('Copy failed – check clipboard permissions', 'error'));
}

/* ── Delete Flow ── */
function openDeleteConfirm(id) {
  _pendingDeleteId = id;
  showOverlay('deleteOverlay');
}

function confirmDelete() {
  if (!_pendingDeleteId) return;
  crudDelete(_pendingDeleteId);
  _pendingDeleteId = null;
  hideOverlay('deleteOverlay');
  showToast('🗑️  Test case deleted', 'info');
  refreshAll();
}

/* ══════════════════════════════════════════════════
   7. GENERATOR FORM
══════════════════════════════════════════════════ */

/** Pending generated test cases (not yet saved) */
let _generatedCases = [];

function handleGeneratorSubmit(e) {
  e.preventDefault();
  if (!validateGeneratorForm()) return;

  const module      = document.getElementById('inputModule').value.trim();
  const description = document.getElementById('inputDescription').value.trim();
  const precondition = document.getElementById('inputPrecondition').value.trim();
  const testData    = document.getElementById('inputTestData').value.trim();
  const expected    = document.getElementById('inputExpected').value.trim();

  _generatedCases = generateTestCases({ module, description, precondition, testData, expected });

  renderGeneratorPreview(_generatedCases);
  showToast(`⚡  ${_generatedCases.length} test cases generated`, 'success');
}

function validateGeneratorForm() {
  let valid = true;
  const fields = [
    { id: 'inputModule',      errId: 'errModule' },
    { id: 'inputDescription', errId: 'errDescription' },
    { id: 'inputExpected',    errId: 'errExpected' },
  ];
  fields.forEach(({ id, errId }) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    if (!el.value.trim()) {
      el.classList.add('is-error');
      err.classList.remove('hidden');
      valid = false;
    } else {
      el.classList.remove('is-error');
      err.classList.add('hidden');
    }
  });
  return valid;
}

function renderGeneratorPreview(cases) {
  const preview = document.getElementById('generatedPreview');
  const cards   = document.getElementById('previewCards');
  const count   = document.getElementById('generatedCount');

  preview.classList.remove('hidden');
  count.textContent = `(${cases.length} test cases)`;

  cards.innerHTML = cases.map((tc, i) => `
    <div class="preview-card flex gap-4">
      <div class="card-type-bar rounded" style="background:${TYPE_COLOR[tc.type]||'#94A3B8'};width:4px;min-height:100%;flex-shrink:0;"></div>
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="text-xs font-mono text-slate-400">#${i+1}</span>
          ${badge(tc.type, TYPE_BADGE[tc.type])}
          ${badge(tc.priority, PRIORITY_BADGE[tc.priority])}
        </div>
        <p class="text-sm font-semibold text-slate-700 mb-2">${escHtml(tc.scenario)}</p>
        <div class="grid sm:grid-cols-2 gap-2 text-xs text-slate-500">
          <div><span class="font-semibold text-slate-400 uppercase tracking-wide text-[0.65rem]">Steps</span><pre class="mt-0.5 whitespace-pre-wrap font-sans text-slate-600 leading-relaxed">${escHtml(tc.steps)}</pre></div>
          <div>
            <div><span class="font-semibold text-slate-400 uppercase tracking-wide text-[0.65rem]">Expected</span><p class="mt-0.5 text-slate-600">${escHtml(tc.expected)}</p></div>
            ${tc.testData ? `<div class="mt-2"><span class="font-semibold text-slate-400 uppercase tracking-wide text-[0.65rem]">Test Data</span><p class="mt-0.5 text-slate-600">${escHtml(tc.testData)}</p></div>` : ''}
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function saveAllGenerated() {
  if (_generatedCases.length === 0) return;
  crudSaveMany(_generatedCases);
  showToast(`✅  ${_generatedCases.length} test cases saved to Management`, 'success');
  _generatedCases = [];
  document.getElementById('generatedPreview').classList.add('hidden');
  document.getElementById('previewCards').innerHTML = '';
  // Clear form
  document.getElementById('generatorForm').reset();
  ['inputModule','inputDescription','inputExpected'].forEach(id => {
    document.getElementById(id)?.classList.remove('is-error');
  });
  ['errModule','errDescription','errExpected'].forEach(id => {
    document.getElementById(id)?.classList.add('hidden');
  });
  refreshAll();
  // Switch to management
  switchSection('management');
}

/* ══════════════════════════════════════════════════
   8. EXPORT – CSV
══════════════════════════════════════════════════ */

function escapeCsvField(value) {
  const str = String(value ?? '').replace(/\r\n/g, ' ').replace(/\n/g, ' ');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function exportToCsv(filename, cases) {
  if (cases.length === 0) {
    showToast('No test cases to export', 'error');
    return;
  }

  const headers = ['Test Case ID','Test Scenario','Test Steps','Test Data','Expected Result','Test Type','Priority','Execution Status','Module','Created At'];
  const rows = cases.map(tc => [
    tc.id,
    tc.scenario,
    tc.steps,
    tc.testData || '',
    tc.expected,
    tc.type,
    tc.priority,
    tc.status,
    tc.module || '',
    tc.createdAt ? new Date(tc.createdAt).toLocaleString() : '',
  ].map(escapeCsvField).join(','));

  const csvContent = [headers.map(escapeCsvField).join(','), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`📥  Exported ${cases.length} test cases to ${filename}`, 'success');
}

/* ══════════════════════════════════════════════════
   9. TOAST NOTIFICATION
══════════════════════════════════════════════════ */

let _toastTimer = null;

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const icons = {
    success: `<svg class="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
    error:   `<svg class="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    info:    `<svg class="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  };

  toast.innerHTML = `${icons[type] || icons.info}<span>${escHtml(message)}</span>`;
  toast.classList.remove('hidden', 'fade-out');

  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 3200);
}

/* ══════════════════════════════════════════════════
   10. NAVIGATION
══════════════════════════════════════════════════ */

const SECTION_TITLES = {
  dashboard:  'Dashboard',
  generator:  'Test Case Generator',
  management: 'Test Case Management',
  execution:  'Test Execution',
  export:     'Export & Report',
};

function switchSection(target) {
  // Hide all sections
  document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
  // Show target section
  const el = document.getElementById(`section-${target}`);
  if (el) el.classList.remove('hidden');

  // Update nav link active state
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.section === target);
  });

  // Update page title
  document.getElementById('pageTitle').textContent = SECTION_TITLES[target] || target;

  // Re-render if switching to a data section
  if (target === 'dashboard')  renderDashboard();
  if (target === 'management') renderManagementTable();
  if (target === 'execution')  renderExecutionCards();
  if (target === 'export')     renderExportSummary();

  // Close mobile sidebar
  closeMobileSidebar();
}

/* ── Mobile Sidebar ── */
function openMobileSidebar() {
  document.getElementById('sidebar').classList.add('is-open');
  document.getElementById('sidebarBackdrop').classList.remove('hidden');
}

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('is-open');
  document.getElementById('sidebarBackdrop').classList.add('hidden');
}

/* ══════════════════════════════════════════════════
   11. OVERLAY HELPERS
══════════════════════════════════════════════════ */

function showOverlay(id) {
  document.getElementById(id)?.classList.remove('hidden');
}

function hideOverlay(id) {
  document.getElementById(id)?.classList.add('hidden');
}

/* ══════════════════════════════════════════════════
   12. EVENT BINDING
══════════════════════════════════════════════════ */

function bindAllEvents() {

  /* ── Sidebar navigation ── */
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      switchSection(link.dataset.section);
    });
  });

  /* ── Mobile sidebar toggle ── */
  document.getElementById('sidebarToggle')?.addEventListener('click', openMobileSidebar);
  document.getElementById('sidebarBackdrop')?.addEventListener('click', closeMobileSidebar);

  /* ── Generator Form ── */
  document.getElementById('generatorForm')?.addEventListener('submit', handleGeneratorSubmit);

  document.getElementById('clearFormBtn')?.addEventListener('click', () => {
    document.getElementById('generatorForm').reset();
    document.getElementById('generatedPreview')?.classList.add('hidden');
    _generatedCases = [];
    ['inputModule','inputDescription','inputExpected'].forEach(id => {
      document.getElementById(id)?.classList.remove('is-error');
    });
    ['errModule','errDescription','errExpected'].forEach(id => {
      document.getElementById(id)?.classList.add('hidden');
    });
  });

  document.getElementById('saveAllBtn')?.addEventListener('click', saveAllGenerated);

  /* ── Add Test Case Button (Management) ── */
  document.getElementById('addManualBtn')?.addEventListener('click', openAddModal);

  /* ── Table action delegation (view / edit / delete) ── */
  document.getElementById('testCaseTableBody')?.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.classList.contains('action-view'))   openDetailModal(id);
    if (btn.classList.contains('action-edit'))   openEditModal(id);
    if (btn.classList.contains('action-delete')) openDeleteConfirm(id);
  });

  /* ── Modal Form Submit ── */
  document.getElementById('modalForm')?.addEventListener('submit', handleModalSubmit);

  /* ── Close Modals ── */
  document.getElementById('closeModal')?.addEventListener('click',  () => hideOverlay('modalOverlay'));
  document.getElementById('cancelModal')?.addEventListener('click', () => hideOverlay('modalOverlay'));
  document.getElementById('modalOverlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) hideOverlay('modalOverlay');
  });

  document.getElementById('closeDetail')?.addEventListener('click',    () => hideOverlay('detailOverlay'));
  document.getElementById('closeDetailBtn')?.addEventListener('click', () => hideOverlay('detailOverlay'));
  document.getElementById('detailOverlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('detailOverlay')) hideOverlay('detailOverlay');
  });
  document.getElementById('copyDetailBtn')?.addEventListener('click', copyDetail);

  /* ── Delete Confirm ── */
  document.getElementById('confirmDeleteBtn')?.addEventListener('click', confirmDelete);
  document.getElementById('cancelDeleteBtn')?.addEventListener('click',  () => hideOverlay('deleteOverlay'));
  document.getElementById('deleteOverlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('deleteOverlay')) hideOverlay('deleteOverlay');
  });

  /* ── Execution status change (event delegation) ── */
  document.getElementById('executionCards')?.addEventListener('change', e => {
    if (!e.target.classList.contains('exec-status-select')) return;
    const id     = e.target.dataset.id;
    const status = e.target.value;
    crudUpdate(id, { status });
    // Update select styling
    e.target.className = `status-select ${statusSelectClass(status)} exec-status-select`;
    renderDashboard();
    renderExportSummary();
    showToast(`Status updated to "${status}"`, 'info');
  });

  /* ── Export buttons ── */
  document.getElementById('exportAllBtn')?.addEventListener('click', () => {
    const all = crudGetAll();
    exportToCsv(`testflow_all_${dateStamp()}.csv`, all);
  });

  document.getElementById('exportFailBtn')?.addEventListener('click', () => {
    const failed = crudGetAll().filter(t => t.status === 'Fail');
    exportToCsv(`testflow_failed_${dateStamp()}.csv`, failed);
  });

  /* ── Filters ── */
  bindFilterEvents();

  /* ── Keyboard: close modals with Escape ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      hideOverlay('modalOverlay');
      hideOverlay('detailOverlay');
      hideOverlay('deleteOverlay');
      closeMobileSidebar();
    }
  });
}

function dateStamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

/* ══════════════════════════════════════════════════
   13. INIT
══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  bindAllEvents();
  renderDashboard();      // Default section
  renderManagementTable();
  renderExportSummary();
});
