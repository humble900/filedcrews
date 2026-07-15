import { useAuth } from './useAuth';

export type TermKey =
  | 'job' | 'jobs' | 'Job' | 'Jobs'
  | 'project' | 'projects' | 'Project' | 'Projects'
  | 'crew' | 'Crew'
  | 'crewMember' | 'crewMembers' | 'CrewMember' | 'CrewMembers'
  | 'customer' | 'customers' | 'Customer' | 'Customers'
  | 'task' | 'tasks' | 'Task' | 'Tasks';

const TERMS_MATRIX: Record<string, Record<TermKey, string>> = {
  General: {
    job: 'job', jobs: 'jobs', Job: 'Job', Jobs: 'Jobs',
    project: 'project', projects: 'projects', Project: 'Project', Projects: 'Projects',
    crew: 'crew', Crew: 'Crew',
    crewMember: 'crew member', crewMembers: 'crew members', CrewMember: 'Crew Member', CrewMembers: 'Crew Members',
    customer: 'customer', customers: 'customers', Customer: 'Customer', Customers: 'Customers',
    task: 'task', tasks: 'tasks', Task: 'Task', Tasks: 'Tasks',
  },
  HVAC: {
    job: 'service call', jobs: 'service calls', Job: 'Service Call', Jobs: 'Service Calls',
    project: 'installation', projects: 'installations', Project: 'Installation', Projects: 'Installations',
    crew: 'crew', Crew: 'Crew',
    crewMember: 'technician', crewMembers: 'technicians', CrewMember: 'Technician', CrewMembers: 'Technicians',
    customer: 'client', customers: 'clients', Customer: 'Client', Customers: 'Clients',
    task: 'checklist item', tasks: 'checklist items', Task: 'Checklist Item', Tasks: 'Checklist Items',
  },
  Landscaping: {
    job: 'mow visit', jobs: 'mow visits', Job: 'Mow Visit', Jobs: 'Mow Visits',
    project: 'contract', projects: 'contracts', Project: 'Contract', Projects: 'Contracts',
    crew: 'crew', Crew: 'Crew',
    crewMember: 'landscaper', crewMembers: 'landscapers', CrewMember: 'Landscaper', CrewMembers: 'Landscapers',
    customer: 'client', customers: 'clients', Customer: 'Client', Customers: 'Clients',
    task: 'service item', tasks: 'service items', Task: 'Service Item', Tasks: 'Service Items',
  },
  Electrical: {
    job: 'dispatch', jobs: 'dispatches', Job: 'Dispatch', Jobs: 'Dispatches',
    project: 'jobsite', projects: 'jobsites', Project: 'Jobsite', Projects: 'Jobsites',
    crew: 'crew', Crew: 'Crew',
    crewMember: 'electrician', crewMembers: 'electricians', CrewMember: 'Electrician', CrewMembers: 'Electricians',
    customer: 'client', customers: 'clients', Customer: 'Client', Customers: 'Clients',
    task: 'wiring task', tasks: 'wiring tasks', Task: 'Wiring Task', Tasks: 'Wiring Tasks',
  },
  Plumbing: {
    job: 'service call', jobs: 'service calls', Job: 'Service Call', Jobs: 'Service Calls',
    project: 'installation', projects: 'installations', Project: 'Installation', Projects: 'Installations',
    crew: 'crew', Crew: 'Crew',
    crewMember: 'plumber', crewMembers: 'plumbers', CrewMember: 'Plumber', CrewMembers: 'Plumbers',
    customer: 'client', customers: 'clients', Customer: 'Client', Customers: 'Clients',
    task: 'fixture task', tasks: 'fixture tasks', Task: 'Fixture Task', Tasks: 'Fixture Tasks',
  },
  Cleaning: {
    job: 'cleaning', jobs: 'cleanings', Job: 'Cleaning', Jobs: 'Cleanings',
    project: 'property', projects: 'properties', Project: 'Property', Projects: 'Properties',
    crew: 'crew', Crew: 'Crew',
    crewMember: 'cleaner', crewMembers: 'cleaners', CrewMember: 'Cleaner', CrewMembers: 'Cleaners',
    customer: 'client', customers: 'clients', Customer: 'Client', Customers: 'Clients',
    task: 'room task', tasks: 'room tasks', Task: 'Room Task', Tasks: 'Room Tasks',
  },
  Security: {
    job: 'patrol shift', jobs: 'patrol shifts', Job: 'Patrol Shift', Jobs: 'Patrol Shifts',
    project: 'secured site', projects: 'secured sites', Project: 'Secured Site', Projects: 'Secured Sites',
    crew: 'guards crew', Crew: 'Guards Crew',
    crewMember: 'guard', crewMembers: 'guards', CrewMember: 'Guard', CrewMembers: 'Guards',
    customer: 'client', customers: 'clients', Customer: 'Client', Customers: 'Clients',
    task: 'checkpoint', tasks: 'checkpoints', Task: 'Checkpoint', Tasks: 'Checkpoints',
  },
  Fleet: {
    job: 'dispatch run', jobs: 'dispatch runs', Job: 'Dispatch Run', Jobs: 'Dispatch Runs',
    project: 'delivery route', projects: 'delivery routes', Project: 'Delivery Route', Projects: 'Delivery Routes',
    crew: 'fleet', Crew: 'Fleet',
    crewMember: 'driver', crewMembers: 'drivers', CrewMember: 'Driver', CrewMembers: 'Drivers',
    customer: 'client', customers: 'clients', Customer: 'Client', Customers: 'Clients',
    task: 'stop checklist', tasks: 'stop checklists', Task: 'Stop Checklist', Tasks: 'Stop Checklists',
  },
};

export function useTerminology() {
  const { company } = useAuth();
  const industry = (company as any)?.industry || 'General';

  const t = (key: TermKey): string => {
    const industryTerms = TERMS_MATRIX[industry] || TERMS_MATRIX.General;
    return industryTerms[key] || TERMS_MATRIX.General[key];
  };

  return { t, industry };
}
