import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders DeptDesk main workspace", () => {
  render(<App />);
  const brandElement = screen.getByText(/Dept/i);
  expect(brandElement).toBeInTheDocument();
});
