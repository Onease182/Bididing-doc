const form = document.getElementById('bid-form');
const fields = [...form.querySelectorAll('input, select')];
let jvNameManual = Boolean((form.elements.JV_NAME?.value || '').trim());
let jvAddressManual = Boolean((form.elements.JV_ADDRESS?.value || '').trim());

function value(name) {
  return (form.elements[name]?.value || '').trim();
}

function setValue(name, nextValue) {
  const field = form.elements[name];
  if (!field) return;
  field.value = nextValue || '';
  field.dispatchEvent(new Event('input', { bubbles: true }));
}

function setCheck(id, complete) {
  const node = document.getElementById(id);
  node.textContent = complete ? '✓' : '○';
  node.style.color = complete ? '#55c895' : '#89aaff';
}

function updateJvSuggestions() {
  if (!jvNameManual) {
    const names = ['LEAD_PARTNER_SHORT', 'FIRST_PARTNER_SHORT', 'SECOND_PARTNER_SHORT']
      .map(value).filter(Boolean);
    const single = value('BID_TYPE') === 'Single Bidder';
    if (names.length || single) setValue('JV_NAME', single ? value('LEAD_PARTNER_NAME') : `${names.join(' - ')} J/V`);
  }
  if (!jvAddressManual) {
    const addresses = ['LEAD_ADDRESS', 'FIRST_ADDRESS', 'SECOND_ADDRESS'].map(value).filter(Boolean);
    const unique = [...new Set(addresses)];
    if (unique.length) setValue('JV_ADDRESS', unique.join(' / '));
  }
}

function updateReadiness() {
  const project = Boolean(value('PROJECT_NAME') && value('BID_DATE'));
  const employer = Boolean(value('EMPLOYER_NAME'));
  const lead = Boolean(value('LEAD_PARTNER_NAME') && value('LEAD_ADDRESS'));
  const single = value('BID_TYPE') === 'Single Bidder';
  const ownership = single || Math.abs((parseFloat(value('L_PER')) || 0) + (parseFloat(value('F_PER')) || 0) + (parseFloat(value('S_PER')) || 0) - 100) < 0.01;
  const completed = [project, employer, lead, ownership].filter(Boolean).length;
  const percent = Math.round(completed / 4 * 100);
  document.getElementById('readiness-fill').style.width = `${percent}%`;
  document.getElementById('readiness-percent').textContent = `${percent}%`;
  document.getElementById('readiness-label').textContent = percent === 100 ? 'Ready to export' : percent ? 'In progress' : 'Getting started';
  setCheck('check-project', project); setCheck('check-employer', employer); setCheck('check-lead', lead); setCheck('check-ownership', ownership);
  document.querySelectorAll('[data-partner]').forEach(card => {
    const prefix = card.dataset.partner;
    card.style.opacity = prefix !== 'LEAD' && !value(`${prefix}_PARTNER_NAME`) ? '.82' : '1';
  });
}

async function loadProfile(select) {
  if (!select.value) return;
  const response = await fetch(`/api/profiles/${select.value}`);
  if (!response.ok) return;
  const profile = await response.json();
  const prefix = select.dataset.role.toUpperCase();
  const mapping = {
    partner_name: `${prefix}_PARTNER_NAME`, partner_short: `${prefix}_PARTNER_SHORT`, address: `${prefix}_ADDRESS`,
    partner_ceo: `${prefix}_PARTNER_CEO`, partner_md1: `${prefix}_PARTNER_MD1`, partner_md2: `${prefix}_PARTNER_MD2`
  };
  Object.entries(mapping).forEach(([source, target]) => setValue(target, profile[source]));
  updateJvSuggestions();
  updateReadiness();
}

async function saveProfile(button) {
  const role = button.dataset.role;
  const prefix = role.toUpperCase();
  const name = window.prompt('Name this partner profile:');
  if (!name || !name.trim()) return;
  const response = await fetch('/api/profiles', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ name: name.trim(), role, values: {
      partner_name: value(`${prefix}_PARTNER_NAME`), partner_short: value(`${prefix}_PARTNER_SHORT`), address: value(`${prefix}_ADDRESS`),
      partner_ceo: value(`${prefix}_PARTNER_CEO`), partner_md1: value(`${prefix}_PARTNER_MD1`), partner_md2: value(`${prefix}_PARTNER_MD2`)
    }})
  });
  const result = await response.json();
  if (!response.ok) { window.alert(result.error || 'Could not save profile.'); return; }
  document.querySelectorAll(`.profile-select[data-role="${role}"]`).forEach(select => {
    const option = new Option(`${result.name} · ${result.role}`, result.id, true, true);
    select.add(option);
  });
  window.alert('Profile saved.');
}

fields.forEach(field => field.addEventListener('input', () => {
  if (field.name === 'JV_NAME') jvNameManual = true;
  if (field.name === 'JV_ADDRESS') jvAddressManual = true;
  updateReadiness();
}));
fields.forEach(field => field.addEventListener('change', () => {
  if (field.name === 'JV_NAME') jvNameManual = true;
  if (field.name === 'JV_ADDRESS') jvAddressManual = true;
  updateReadiness();
}));
document.querySelectorAll('.profile-select').forEach(select => select.addEventListener('change', () => loadProfile(select)));
document.querySelectorAll('.save-profile').forEach(button => button.addEventListener('click', () => saveProfile(button)));
['LEAD_PARTNER_SHORT', 'FIRST_PARTNER_SHORT', 'SECOND_PARTNER_SHORT', 'LEAD_ADDRESS', 'FIRST_ADDRESS', 'SECOND_ADDRESS'].forEach(name => {
  form.elements[name]?.addEventListener('input', updateJvSuggestions);
});
updateJvSuggestions();
updateReadiness();

const profileStatus = document.getElementById('profile-status');
const continueProject = document.getElementById('continue-project');
let profileReady = Boolean(value('LEAD_PARTNER_NAME') && value('LEAD_PARTNER_SHORT'));

function applyProfile(profile) {
  const mapping = {
    partner_name: 'LEAD_PARTNER_NAME', partner_short: 'LEAD_PARTNER_SHORT', address: 'LEAD_ADDRESS',
    partner_ceo: 'LEAD_PARTNER_CEO', partner_md1: 'LEAD_PARTNER_MD1', partner_md2: 'LEAD_PARTNER_MD2'
  };
  Object.entries(mapping).forEach(([source, target]) => setValue(target, profile[source]));
  document.getElementById('new-profile-name').value = profile.name || '';
  document.getElementById('profile-identifier').value = profile.identifier || '';
  document.getElementById('profile-identifier-type').value = profile.identifier_type || 'direct';
  document.getElementById('profile-borg-number').value = profile.borg_number || '';
  document.getElementById('profile-partner-name').value = profile.partner_name || '';
  document.getElementById('profile-partner-short').value = profile.partner_short || '';
  document.getElementById('profile-address').value = profile.address || '';
  document.getElementById('profile-ceo').value = profile.partner_ceo || '';
  document.getElementById('profile-md1').value = profile.partner_md1 || '';
  document.getElementById('profile-md2').value = profile.partner_md2 || '';
  profileReady = true;
  document.body.classList.add('profile-complete');
  continueProject.disabled = false;
  profileStatus.textContent = `Using ${profile.name} · ${profile.partner_short}`;
  updateJvSuggestions(); updateReadiness();
}

async function fetchAndApplyProfile(url) {
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok) { window.alert(result.error || 'Profile not found.'); return; }
  applyProfile(result);
}

document.getElementById('existing-profile')?.addEventListener('change', event => {
  if (event.target.value) fetchAndApplyProfile(`/api/profiles/${event.target.value}`);
});
document.getElementById('lookup-profile')?.addEventListener('click', () => {
  const identifier = document.getElementById('profile-lookup').value.trim();
  if (!identifier) { window.alert('Enter a Gmail address or direct profile ID.'); return; }
  fetchAndApplyProfile(`/api/profiles/lookup/${encodeURIComponent(identifier)}`);
});
document.getElementById('create-profile')?.addEventListener('click', async () => {
  const required = ['new-profile-name', 'profile-identifier', 'profile-borg-number', 'profile-partner-name', 'profile-partner-short', 'profile-address'];
  if (required.some(id => !document.getElementById(id).value.trim())) {
    window.alert('Complete the profile name, identifier, Borg number, legal name, short name, and address.'); return;
  }
  const response = await fetch('/api/profiles', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      name: document.getElementById('new-profile-name').value.trim(),
      role: 'lead',
      identifier: document.getElementById('profile-identifier').value.trim(),
      identifier_type: document.getElementById('profile-identifier-type').value,
      values: {
        borg_number: document.getElementById('profile-borg-number').value.trim(),
        partner_name: document.getElementById('profile-partner-name').value.trim(),
        partner_short: document.getElementById('profile-partner-short').value.trim(),
        address: document.getElementById('profile-address').value.trim(),
        partner_ceo: document.getElementById('profile-ceo').value.trim(),
        partner_md1: document.getElementById('profile-md1').value.trim(),
        partner_md2: document.getElementById('profile-md2').value.trim()
      }
    })
  });
  const result = await response.json();
  if (!response.ok) { window.alert(result.error || 'Could not create profile.'); return; }
  const option = new Option(`${result.name} · ${result.partner_short}`, result.id, true, true);
  document.getElementById('existing-profile').add(option);
  applyProfile(result);
});
document.getElementById('continue-project')?.addEventListener('click', () => {
  document.getElementById('project-workspace').scrollIntoView({behavior: 'smooth', block: 'start'});
});
if (profileReady) {
  document.body.classList.add('profile-complete');
  continueProject.disabled = false;
  profileStatus.textContent = 'Profile details already present';
}
