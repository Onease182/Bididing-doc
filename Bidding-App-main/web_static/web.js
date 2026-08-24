const form = document.getElementById('bid-form');
const fields = [...form.querySelectorAll('input, select')];
const partnerNames = ['LEAD_PARTNER_NAME', 'FIRST_PARTNER_NAME', 'SECOND_PARTNER_NAME'];

function setCheck(id, complete) {
  const node = document.getElementById(id);
  node.textContent = complete ? '✓' : '○';
  node.style.color = complete ? '#55c895' : '#89aaff';
}

function updateReadiness() {
  const value = name => (form.elements[name]?.value || '').trim();
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
fields.forEach(field => field.addEventListener('input', updateReadiness));
fields.forEach(field => field.addEventListener('change', updateReadiness));
updateReadiness();
