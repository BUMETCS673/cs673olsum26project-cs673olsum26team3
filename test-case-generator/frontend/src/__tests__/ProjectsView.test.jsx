import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectsView from '../views/Projects/ProjectsView';

const mockOnNavigate    = vi.fn();
const mockOnDeleteProject = vi.fn();
const mockOnNewProject  = vi.fn();

const SAMPLE_PROJECTS = [
  { _id: 'p1', name: 'Alpha Project', description: 'First project', createdAt: '2025-01-01T00:00:00.000Z' },
  { _id: 'p2', name: 'Beta Project',  description: 'Second project', createdAt: '2025-02-01T00:00:00.000Z' },
];

function renderProjects(projects = SAMPLE_PROJECTS) {
  return render(
    <ProjectsView
      projects={projects}
      documents={[]}
      onNavigate={mockOnNavigate}
      onDeleteProject={mockOnDeleteProject}
      onNewProject={mockOnNewProject}
    />
  );
}

describe('ProjectsView – empty state', () => {
  test('shows welcome message when there are no projects', () => {
    renderProjects([]);
    expect(screen.getByText(/welcome to speccheck/i)).toBeInTheDocument();
  });

  test('shows "Create Your First Project" call-to-action in empty state', () => {
    renderProjects([]);
    expect(screen.getByRole('button', { name: /create your first project/i })).toBeInTheDocument();
  });

  test('does not render any project cards in empty state', () => {
    renderProjects([]);
    expect(screen.queryByText('Alpha Project')).not.toBeInTheDocument();
  });
});

describe('ProjectsView – project cards', () => {
  test('renders a card for each project', () => {
    renderProjects();
    expect(screen.getByText('Alpha Project')).toBeInTheDocument();
    expect(screen.getByText('Beta Project')).toBeInTheDocument();
  });

  test('renders Documents and View Tests buttons for each project', () => {
    renderProjects();
    expect(screen.getAllByRole('button', { name: /documents/i })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /view tests/i })).toHaveLength(2);
  });

  test('calls onNavigate with projectId and "documents" when Documents is clicked', async () => {
    renderProjects();
    await userEvent.click(screen.getAllByRole('button', { name: /documents/i })[0]);
    expect(mockOnNavigate).toHaveBeenCalledWith('p1', 'documents');
  });

  test('calls onNavigate with projectId and "testcases" when View Tests is clicked', async () => {
    renderProjects();
    await userEvent.click(screen.getAllByRole('button', { name: /view tests/i })[0]);
    expect(mockOnNavigate).toHaveBeenCalledWith('p1', 'testcases');
  });

  test('shows project description in each card', () => {
    renderProjects();
    expect(screen.getByText('First project')).toBeInTheDocument();
    expect(screen.getByText('Second project')).toBeInTheDocument();
  });
});

describe('ProjectsView – New Project modal', () => {
  test('always shows the New Project button in the header', () => {
    renderProjects();
    expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument();
  });

  test('opens the Create New Project modal on button click', async () => {
    renderProjects();
    await userEvent.click(screen.getByRole('button', { name: /new project/i }));
    expect(screen.getByText(/create new project/i)).toBeInTheDocument();
  });

  test('modal contains Project Name and Description fields', async () => {
    renderProjects();
    await userEvent.click(screen.getByRole('button', { name: /new project/i }));
    expect(screen.getByPlaceholderText(/e\.g\., Mobile App/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/what is this project about/i)).toBeInTheDocument();
  });

  test('closes the modal when Cancel is clicked', async () => {
    renderProjects();
    await userEvent.click(screen.getByRole('button', { name: /new project/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText(/create new project/i)).not.toBeInTheDocument();
  });

  test('calls onNewProject with name and description on form submit', async () => {
    mockOnNewProject.mockResolvedValue(true);
    renderProjects();
    await userEvent.click(screen.getByRole('button', { name: /new project/i }));
    await userEvent.type(screen.getByPlaceholderText(/e\.g\., Mobile App/i), 'My App');
    await userEvent.type(screen.getByPlaceholderText(/what is this project about/i), 'A description');
    await userEvent.click(screen.getByRole('button', { name: /create project/i }));
    await waitFor(() =>
      expect(mockOnNewProject).toHaveBeenCalledWith({ name: 'My App', description: 'A description' })
    );
  });

  test('does not call onNewProject when name is blank', async () => {
    renderProjects();
    await userEvent.click(screen.getByRole('button', { name: /new project/i }));
    await userEvent.click(screen.getByRole('button', { name: /create project/i }));
    expect(mockOnNewProject).not.toHaveBeenCalled();
  });
});

describe('ProjectsView – delete project', () => {
  test('renders a delete button for each project card', () => {
    renderProjects();
    const allButtons = screen.getAllByRole('button');
    const deleteButtons = allButtons.filter(b => b.classList.contains('p-2'));
    expect(deleteButtons).toHaveLength(SAMPLE_PROJECTS.length);
  });
});
