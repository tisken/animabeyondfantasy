export function renderTemplates(...templates) {
  const fn = foundry.applications?.handlebars?.renderTemplate ?? renderTemplate;
  return Promise.all(
    templates.map(template => fn(template.name, template.context ?? {}))
  );
}
