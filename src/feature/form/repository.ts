import { InferInsertModel, eq } from "drizzle-orm";
import {
  fieldAnswers,
  fields,
  form,
  formSubmissions,
} from "../../database/schema";
import { db } from "../../database/db";
import { and } from "drizzle-orm";
import { notInArray } from "drizzle-orm";
import { InferSelectModel } from "drizzle-orm";

export const FORM = {
  async getAll() {
    return await db.select().from(form);
  },

  async getById(id: string) {
    const result = await db
      .select()
      .from(form)
      .where(eq(form.id, id))
      .innerJoin(fields, eq(form.id, fields.formId));

    if (!result.length) return null;

    const formData = {
      form: result[0]!.forms,
      fields: [] as InferSelectModel<typeof fields>[],
    };

    for (const row of result) {
      formData.fields.push(row.fields);
    }

    return formData;
  },

  async create(
    formData: InferInsertModel<typeof form> & {
      fields?: Omit<InferInsertModel<typeof fields>, "formId">[];
    },
  ) {
    const formId = await db.transaction(async (tx) => {
      const [newForm] = await tx.insert(form).values(formData).returning({
        id: form.id,
      });

      if (!newForm) throw new Error("Failed to create form");

      if (formData.fields && formData.fields.length > 0) {
        const fieldsToInsert = formData.fields.map((field) => ({
          ...field,
          formId: newForm.id,
        }));
        await tx.insert(fields).values(fieldsToInsert);
      }

      return newForm.id;
    });

    return formId;
  },

  async update(
    id: string,
    formData: Partial<InferInsertModel<typeof form>> & {
      fields?: Array<
        Omit<InferInsertModel<typeof fields>, "formId"> & {
          id?: string;
        }
      >;
    },
  ) {
    return await db.transaction(async (tx) => {
      const { fields: newFields, ...formUpdateData } = formData;

      await tx.update(form).set(formUpdateData).where(eq(form.id, id));

      if (newFields) {
        const existingFields = await tx
          .select()
          .from(fields)
          .where(eq(fields.formId, id));

        const existingFieldIds = existingFields.map((f) => f.id);
        const newFieldIds = newFields.map((f) => f.id);

        const fieldsToDelete = existingFieldIds.filter(
          (eid) => !newFieldIds.includes(eid),
        );

        if (fieldsToDelete.length > 0) {
          await tx
            .delete(fields)
            .where(
              and(eq(fields.formId, id), notInArray(fields.id, fieldsToDelete)),
            );
        }

        for (const f of newFields) {
          if (f.id && existingFieldIds.includes(f.id)) {
            const { id: fieldId, ...fieldData } = f;
            await tx
              .update(fields)
              .set(fieldData)
              .where(and(eq(fields.id, fieldId), eq(fields.formId, id)));
          } else {
            const { id: _, ...fieldData } = f;
            await tx.insert(fields).values({ formId: id, ...fieldData });
          }
        }
      }

      return await FORM.getById(id);
    });
  },

  delete: async (id: string) => {
    const deletedCount = await db
      .delete(form)
      .where(eq(form.id, id))
      .returning({
        id: form.id,
      });
    return deletedCount.length > 0;
  },
};

export const RESPONSE = {
  getAllByFormId: async (formId: string) => {
    const responses = await db
      .select()
      .from(formSubmissions)
      .where(eq(formSubmissions.formId, formId))
      .innerJoin(
        fieldAnswers,
        eq(formSubmissions.id, fieldAnswers.submissionId),
      );

    return responses;
  },

  create: async (formId: string, answers: Record<string, any>) => {
    const id = await db.transaction(async (tx) => {
      const [newSubmission] = await tx
        .insert(formSubmissions)
        .values({ formId })
        .returning({ id: form.id });
      if (!newSubmission) throw new Error("Failed to create submission");

      const answerEntries = Object.entries(answers).map(
        ([fieldId, value]) =>
          ({
            submissionId: newSubmission.id,
            fieldId,
            value,
          }) satisfies InferInsertModel<typeof fieldAnswers>,
      );

      await tx.insert(fieldAnswers).values(answerEntries);

      return newSubmission.id;
    });

    return id;
  },
};
