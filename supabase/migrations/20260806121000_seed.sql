-- Seed companies and SAP jobs for landing / search demos

insert into public.companies (id, name, logo, description, website, location) values
  ('infosys', 'Infosys', 'I', 'Global digital services and consulting leader hiring across SAP modules.', 'https://www.infosys.com', 'Bengaluru, India'),
  ('tcs', 'TCS', 'T', 'Enterprise transformation partner with deep SAP practice.', 'https://www.tcs.com', 'Mumbai, India'),
  ('accenture', 'Accenture', 'A', 'Strategy and technology consulting with SAP S/4HANA programs.', 'https://www.accenture.com', 'Hyderabad, India'),
  ('deloitte', 'Deloitte', 'D', 'Advisory and implementation services across SAP Finance and Logistics.', 'https://www.deloitte.com', 'Gurugram, India')
on conflict (id) do nothing;

insert into public.jobs (
  id, title, company_id, location, salary_min, salary_max, experience_years,
  work_mode, module, skills, description, requirements, benefits, featured, status
) values
(
  'sap-commerce-dev',
  'SAP Commerce Developer',
  'infosys',
  'Hyderabad',
  20, 28, 5,
  'Remote',
  'commerce',
  array['SAP Commerce', 'Java', 'Spring', 'Spartacus'],
  'Build and extend SAP Commerce Cloud storefronts and integrations for enterprise retail clients.',
  array['5+ years SAP Commerce / Hybris experience', 'Strong Java and Spring skills', 'Experience with Spartacus or composable storefront'],
  array['Remote-first', 'Health insurance', 'Learning budget'],
  true,
  'published'
),
(
  'abap-specialist',
  'ABAP Specialist',
  'tcs',
  'Bengaluru',
  16, 22, 4,
  'Hybrid',
  'abap',
  array['ABAP', 'OOABAP', 'CDS', 'RAP'],
  'Design and deliver ABAP RAP applications on S/4HANA.',
  array['Strong OOABAP', 'CDS views', 'RAP experience preferred'],
  array['Hybrid office', 'Certification support'],
  true,
  'published'
),
(
  'fiori-consultant',
  'SAP Fiori Consultant',
  'accenture',
  'Pune',
  18, 25, 6,
  'Onsite',
  'fiori',
  array['Fiori', 'UI5', 'OData', 'BTP'],
  'Lead Fiori UX delivery and extensions on BTP.',
  array['UI5 expertise', 'OData services', 'Design thinking'],
  array['Onsite client exposure', 'Global projects'],
  true,
  'published'
),
(
  'btp-architect',
  'SAP BTP Architect',
  'deloitte',
  'Gurugram',
  28, 40, 8,
  'Hybrid',
  'btp',
  array['BTP', 'CAP', 'Integration Suite', 'Cloud Foundry'],
  'Define BTP target architectures and integration patterns.',
  array['Enterprise architecture', 'CAP / Node or Java', 'Integration Suite'],
  array['Leadership track', 'Flexible hybrid'],
  false,
  'published'
),
(
  'mm-consultant',
  'SAP MM Consultant',
  'infosys',
  'Chennai',
  14, 20, 3,
  'Hybrid',
  'mm',
  array['MM', 'S/4HANA', 'Procurement'],
  'Implement and support Materials Management processes on S/4HANA.',
  array['MM configuration', 'Procurement cycles', 'Client workshops'],
  array['Training programs', 'Relocation support'],
  false,
  'published'
),
(
  'fico-lead',
  'SAP FICO Lead',
  'accenture',
  'Mumbai',
  24, 32, 7,
  'Remote',
  'fico',
  array['FICO', 'S/4HANA Finance', 'Controlling'],
  'Lead Finance workstreams for S/4HANA transformations.',
  array['Deep FI/CO', 'S/4 Finance', 'Stakeholder management'],
  array['Remote', 'Performance bonus'],
  false,
  'published'
)
on conflict (id) do nothing;
