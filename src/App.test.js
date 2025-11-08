import { render, screen } from '@testing-library/react';
import App from './App';

test('renders theme toggle button', () => {
  render(<App />);
  const toggle = screen.getByRole('button');
  expect(toggle).toBeInTheDocument();
});
