-- Delete all forms and fields with answers
TRUNCATE TABLE field_answers, fields, forms RESTART IDENTITY CASCADE;
