export function checkStatus(response: Response) {
  if (response.status === 401 || response.status === 422) {
    const token = localStorage.getItem("token");
    if (token) {
      localStorage.removeItem("token");
      window.location.reload();
    }
    return;
  }
  // If the response is ok, return the response to continue the promise chain
  if (response.ok) {
    return response;
  }
  throw new Error(`Request failed with status: ${response.status}`);
}
