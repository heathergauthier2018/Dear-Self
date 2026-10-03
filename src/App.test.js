import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

// Keep arrival routing tests independent of the journal's unrelated effects.
jest.mock('./components/JournalEntry', () => function JournalEntry() {
  return <h1>Today's journal</h1>;
});

const CHECK_IN_KEY = 'dearself.gentleCheckIn.latest';
const clickButton = (name) => fireEvent.click(screen.getByRole('button', { name }));

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState(null, '', '/');
  document.body.removeAttribute('class');
  document.body.removeAttribute('style');
  Array.from(document.body.attributes)
    .filter((attribute) => attribute.name.startsWith('data-'))
    .forEach((attribute) => document.body.removeAttribute(attribute.name));
});

test.each(['/', '/check-in'])('opens the check-in at %s without journal navigation', async (route) => {
  window.history.replaceState(null, '', `/#${route}`);
  render(<App />);

  expect(await screen.findByRole('heading', { name: 'How are you feeling right now?' })).toBeInTheDocument();
  expect(window.location.hash).toBe('#/check-in');
  expect(screen.getByRole('heading', { name: 'What would feel most supportive right now?' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Not today. Take me to my journal.' })).toBeEnabled();
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});

test.each([
  ['How are you feeling right now?', ['Calm', 'Hopeful', 'Happy', 'Grateful']],
  ['What would feel most supportive right now?', ['Quiet', 'Encouragement', 'Perspective', 'Rest']],
])('limits %s to three selections and allows deselection', (question, choices) => {
  window.history.replaceState(null, '', '/#/check-in');
  render(<App />);
  const group = within(screen.getByRole('group', { name: question }));
  const buttons = choices.map((name) => group.getByRole('button', { name }));

  buttons.slice(0, 3).forEach((button) => fireEvent.click(button));
  expect(buttons[3]).toHaveAttribute('aria-disabled', 'true');
  fireEvent.click(buttons[3]);
  expect(buttons[3]).toHaveAttribute('aria-pressed', 'false');
  expect(group.getAllByRole('button', { pressed: true })).toHaveLength(3);

  fireEvent.click(buttons[0]);
  expect(buttons[0]).toHaveAttribute('aria-pressed', 'false');
  expect(buttons[3]).toHaveAttribute('aria-disabled', 'false');
  fireEvent.click(buttons[3]);
  expect(buttons[3]).toHaveAttribute('aria-pressed', 'true');
});

test('continues with selected and custom feelings, saves them, and opens the gallery', async () => {
  render(<App />);
  await screen.findByRole('heading', { name: 'How are you feeling right now?' });
  clickButton('Calm');
  clickButton('Something else');
  fireEvent.change(screen.getByRole('textbox', { name: 'Describe how you are feeling in your own words' }), {
    target: { value: ' calm, Curious; curious; Energized; Extra' },
  });
  clickButton('Add this custom feeling');
  expect(screen.getByRole('button', { name: 'Remove Curious' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Remove Energized' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Remove Extra' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Happy' })).toHaveAttribute('aria-disabled', 'true');
  clickButton('Remove Energized');
  clickButton('Happy');
  clickButton('Encouragement');
  clickButton('Continue');

  expect(await screen.findByRole('main', { name: 'Threshold Gallery' })).toBeInTheDocument();
  expect(window.location.hash).toBe('#/threshold-gallery');
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  const saved = JSON.parse(localStorage.getItem(CHECK_IN_KEY));
  expect(saved).toEqual({
    feelings: ['Calm', 'Happy', 'Curious'],
    customFeelings: ['Curious'],
    support: ['Encouragement'],
    completedAt: expect.any(String),
  });
  expect(new Date(saved.completedAt).toISOString()).toBe(saved.completedAt);
  const mirror = within(screen.getByRole('complementary', { name: 'A note to yourself' }));
  expect(mirror.getByText('I can make room for feeling Calm, Happy, and Curious and still be gentle with myself.')).toBeInTheDocument();
  expect(mirror.getByText('What is one kind thing I need to hear today?')).toBeInTheDocument();
});

test('allows continuing without selecting feelings or support', async () => {
  render(<App />);
  await screen.findByRole('button', { name: 'Continue' });
  clickButton('Continue');

  expect(await screen.findByRole('main', { name: 'Threshold Gallery' })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(CHECK_IN_KEY))).toEqual({
    feelings: [], customFeelings: [], support: [], completedAt: expect.any(String),
  });
});

test('skips to the journal without overwriting a previous check-in', async () => {
  const previous = JSON.stringify({ feelings: ['Hopeful'], support: ['Quiet'] });
  localStorage.setItem(CHECK_IN_KEY, previous);
  render(<App />);
  await screen.findByRole('button', { name: 'Continue' });
  clickButton('Sad');
  clickButton('Not today. Take me to my journal.');

  expect(await screen.findByRole('heading', { name: "Today's journal" })).toBeInTheDocument();
  expect(window.location.hash).toBe('#/today');
  expect(within(screen.getByRole('navigation')).getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page');
  expect(localStorage.getItem(CHECK_IN_KEY)).toBe(previous);
});
