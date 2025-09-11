export type FormResponse = {
  id: string;
  formId: string;
  answers: Record<string, any>; // klucz to nazwa pola, wartość to odpowiedź użytkownika
  submittedAt: string;
};

const responsesByFormId: Record<string, FormResponse[]> = {};

export function getResponses(formId: string): FormResponse[] {
  return responsesByFormId[formId] ?? [];
}

export function addResponse(
  formId: string,
  answers: Record<string, any>,
): FormResponse {
  const response: FormResponse = {
    id: Math.random().toString(36).substring(2, 9),
    formId,
    answers,
    submittedAt: new Date().toISOString(),
  };
  if (!responsesByFormId[formId]) {
    responsesByFormId[formId] = [];
  }
  responsesByFormId[formId].push(response);
  return response;
}
