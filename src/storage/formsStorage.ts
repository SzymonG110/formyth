import { Form } from "../schemas/form";

const forms: Record<string, Form> = {};

export function getAllForms(): Form[] {
  return Object.values(forms);
}

export function getFormById(id: string): Form | undefined {
  return forms[id];
}

export function createForm(form: Form): Form {
  forms[form.id!] = form;
  return form;
}

export function updateForm(id: string, form: Form): Form | undefined {
  if (!forms[id]) return undefined;
  forms[id] = form;
  return form;
}

export function deleteForm(id: string): boolean {
  if (!forms[id]) return false;
  delete forms[id];
  return true;
}
