import { FastifyInstance } from "fastify";
import { z } from "zod";
import { formSchema, Form } from "./schema";
import { FORM } from "./repository";

export default async function formsRoutes(fastify: FastifyInstance) {
  fastify.get("/forms", async (_req, reply) => {
    const allForms = await FORM.getAll();

    return reply.send(allForms);
  });

  fastify.get<{ Params: { id: string } }>("/forms/:id", async (req, reply) => {
    const form = await FORM.getById(req.params.id);

    if (!form) {
      return reply.status(404).send({ error: "Form not found" });
    }

    return reply.send(form);
  });

  fastify.post("/forms", async (req, reply) => {
    try {
      const body = req.body as object;
      const parsed = formSchema.omit({ id: true }).parse(body);

      const id = await FORM.create(parsed);

      return reply.status(201).send({ id, ...parsed });
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Invalid data",
      });
    }
  });

  fastify.put<{ Params: { id: string } }>("/forms/:id", async (req, reply) => {
    try {
      const existing = await FORM.getById(req.params.id);
      if (!existing) {
        return reply.status(404).send({ error: "Form not found" });
      }

      const body = req.body as object;
      const parsed = formSchema.parse({ ...body, id: req.params.id });

      const updatedForm = formsStorage.updateForm(req.params.id, parsed);
      return reply.send(updatedForm);
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Invalid data",
      });
    }
  });

  fastify.delete<{ Params: { id: string } }>(
    "/forms/:id",
    async (req, reply) => {
      const deleted = formsStorage.deleteForm(req.params.id);
      if (!deleted) {
        return reply.status(404).send({ error: "Form not found" });
      }
      return reply.send({ success: true });
    },
  );

  function createResponseSchema(fields: Form["fields"]) {
    const shape: Record<string, any> = {};

    for (const field of fields) {
      let validator: any = z.any();

      if (field.type === "email") {
        validator = z.email();
      } else if (field.type === "number") {
        validator = z.number();
      } else if (field.type === "checkbox") {
        validator = z.boolean();
      } else {
        validator = z.string();
      }

      if (field.required) {
        validator = validator.refine(
          (val: any) => val !== undefined && val !== null && val !== "",
          { message: `${field.label ?? field.name} jest wymagane` },
        );
      } else {
        validator = z.union([validator, z.undefined()]);
      }

      shape[field.name] = validator;
    }

    return z.object(shape);
  }

  fastify.post<{ Params: { id: string } }>(
    "/forms/:id/responses",
    async (req, reply) => {
      const formId = req.params.id;
      const form = formsStorage.getFormById(formId);

      if (!form) {
        return reply.status(404).send({ error: "Form not found" });
      }

      const body = req.body as object;

      try {
        const responseSchema = createResponseSchema(form.fields);
        const parsedAnswers = responseSchema.parse(body);

        const nonEmptyAnswers = Object.entries(parsedAnswers).filter(
          ([_, val]) => val !== undefined && val !== null && val !== "",
        );

        if (nonEmptyAnswers.length === 0) {
          return reply
            .status(400)
            .send({ error: "Answers cannot be empty", answers: {} });
        }

        const savedResponse = responsesStorage.addResponse(
          formId,
          parsedAnswers,
        );
        return reply.status(201).send(savedResponse);
      } catch (error) {
        return reply.status(400).send({
          error: error instanceof Error ? error.message : "Invalid data",
        });
      }
    },
  );

  fastify.get<{ Params: { id: string } }>(
    "/forms/:id/responses",
    async (req, reply) => {
      const formId = req.params.id;
      const form = formsStorage.getFormById(formId);

      if (!form) {
        return reply.status(404).send({ error: "Form not found" });
      }

      const responses = responsesStorage.getResponses(formId);
      return reply.send(responses);
    },
  );
}
