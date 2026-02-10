export function getApiKey(): string {
  const key = process.env.RECOUP_API_KEY;
  if (!key) {
    console.error(
      "Error: RECOUP_API_KEY environment variable is not set.\n" +
        "Set it with: export RECOUP_API_KEY=your-api-key",
    );
    process.exit(1);
  }
  return key;
}

export function getBaseUrl(): string {
  return (
    process.env.RECOUP_API_URL || "https://recoup-api.vercel.app"
  );
}
