export function getHealth() {
  return fetch("http://localhost:8000/health").then((res) => res.json());
}