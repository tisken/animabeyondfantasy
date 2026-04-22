declare const foundry: any;
declare const renderTemplate: any;

interface TemplateSpec {
  name: string;
  context?: Record<string, unknown>;
}

export function renderTemplates(...templates: TemplateSpec[]): Promise<string[]> {
  const fn = foundry.applications?.handlebars?.renderTemplate ?? renderTemplate;
  return Promise.all(
    templates.map(template => fn(template.name, template.context ?? {}))
  );
}
