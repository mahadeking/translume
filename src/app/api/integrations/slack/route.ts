export const runtime = "nodejs";

interface SlackBody {
  webhook: string;
  text: string;
}

// Proxies a message to a Slack Incoming Webhook. Slack webhooks don't send CORS
// headers, so the browser can't POST to them directly — this server route does.
export async function POST(req: Request) {
  let body: SlackBody;
  try {
    body = (await req.json()) as SlackBody;
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const { webhook, text } = body;
  if (!webhook || !/^https:\/\/hooks\.slack\.com\//.test(webhook)) {
    return Response.json(
      { error: "bad_webhook", message: "Enter a valid Slack Incoming Webhook URL (https://hooks.slack.com/…)." },
      { status: 422 }
    );
  }

  try {
    const r = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text || "Hello from Translume 👋" }),
    });
    if (!r.ok) {
      return Response.json(
        { error: "slack_failed", message: `Slack returned ${r.status}.` },
        { status: 502 }
      );
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "slack_unreachable", message: "Couldn't reach Slack. Check the webhook URL." },
      { status: 502 }
    );
  }
}
