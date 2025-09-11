import { FastifyInstance } from "fastify";
import { formSchema, Form } from "../schemas/form";
import * as formsStorage from "../storage/formsStorage";
import * as responsesStorage from "../storage/formResponsesStorage";
import { z } from "zod";

const generateId = () => Math.random().toString(36).substring(2, 9);

export default async function formsRoutes(fastify: FastifyInstance) {
  // GET /forms - lista formularzy
  fastify.get("/forms", async (_req, reply) => {
    const allForms = formsStorage.getAllForms();
    return reply.send(allForms);
  });

  // GET /forms/:id - pobierz formularz po id
  fastify.get<{ Params: { id: string } }>("/forms/:id", async (req, reply) => {
    const form = formsStorage.getFormById(req.params.id);
    if (!form) {
      return reply.status(404).send({ error: "Form not found" });
    }
    return reply.send(form);
  });

  // POST /forms - tworzenie nowego formularza
  fastify.post("/forms", async (req, reply) => {
    try {
      // Wymuszamy typowanie req.body jako obiekt
      const body = req.body as object;

      // Walidacja Zod (bez id)
      const parsed = formSchema.omit({ id: true }).parse(body);

      const id = generateId();
      const newForm: Form = { ...parsed, id };

      formsStorage.createForm(newForm);
      return reply.status(201).send(newForm);
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : "Invalid data",
      });
    }
  });

  // PUT /forms/:id - aktualizacja formularza
  fastify.put<{ Params: { id: string } }>("/forms/:id", async (req, reply) => {
    try {
      const existing = formsStorage.getFormById(req.params.id);
      if (!existing) {
        return reply.status(404).send({ error: "Form not found" });
      }

      // Wymuszamy typ obiektu na req.body, dodajemy id i walidujemy
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

  // DELETE /forms/:id - usuwanie formularza
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

  // Dodajemy walidację odpowiedzi na podstawie pól formularza
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

  // POST /forms/:id/responses - dodanie odpowiedzi
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

        // Sprawdzenie czy odpowiedź nie jest pusta
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
        return reply
          .status(400)
          .send({
            error: error instanceof Error ? error.message : "Invalid data",
          });
      }
    },
  );

  // GET /forms/:id/responses - pobranie odpowiedzi dla formularza
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
