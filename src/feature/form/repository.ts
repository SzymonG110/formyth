import { InferInsertModel, eq } from "drizzle-orm";
import { fields, form } from "../../database/schema";
import { db } from "../../database/db";

export const FORM = {
  async getAll() {
    return await db.select().from(form);
  },

  async getById(id: string) {
    return (
      await db
        .select()
        .from(form)
        .where(eq(form.id, id))
        .innerJoin(fields, eq(form.id, fields.formId))
    )[0];
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

export const RESPONSE = {};
