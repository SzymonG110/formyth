import { InferInsertModel, eq } from "drizzle-orm";
import { form } from "../../database/schema";
import { db } from "../../database/db";

export const FORM = {
  async getAll() {
    return await db.select().from(form);
  },

  async getById(id: string) {
    return await db
      .select()
      .from(form)
      .where(eq(form.id, id))
      .limit(1)
      .then((res) => res[0]);
  },

  async create(formData: InferInsertModel<typeof form>) {
    const inserted = await db
      .insert(form)
      .values(formData)
      .returning({ id: form.id });

    return inserted[0];
  },
};
