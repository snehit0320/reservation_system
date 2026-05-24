export async function getApiErrorMessage(
  response: Response
): Promise<string> {
  const data = await response.json().catch(() => ({}));
  const fallback =
    typeof data.error === "string"
      ? data.error
      : "Request failed";

  if (response.status === 409) {
    return "Not enough stock available.";
  }

  if (response.status === 410) {
    return "This reservation has expired.";
  }

  return fallback;
}
