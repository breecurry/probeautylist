export function formText(form: FormData, name: string) {
  return String(form.get(name) ?? '').trim();
}

export function optionalFormText(form: FormData, name: string) {
  return formText(form, name);
}

export function formInteger(form: FormData, name: string) {
  const value = Number(formText(form, name));
  return Number.isInteger(value) ? value : Number.NaN;
}

export function formCsv(form: FormData, name: string) {
  return formText(form, name)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseMoneyToCents(value: FormDataEntryValue | null) {
  const raw = String(value ?? '').trim();
  if (!raw) return 0;
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return Number.NaN;

  const [dollars, cents = ''] = raw.split('.');
  return Number(dollars) * 100 + Number(cents.padEnd(2, '0'));
}

export function isTimeRange(startTime: string, endTime: string) {
  return /^\d{2}:\d{2}$/.test(startTime) && /^\d{2}:\d{2}$/.test(endTime) && startTime < endTime;
}
