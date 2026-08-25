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
