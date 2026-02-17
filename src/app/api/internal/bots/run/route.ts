import { runDailyBots } from '../../../../../bots/lib/server';
import { NextResponse } from 'next/server';

function isAuthorized(request: Request): boolean {
  const expectedToken = process.env.BOT_RUNNER_TOKEN;
  if (!expectedToken) {
    console.error('[BotsRoute] BOT_RUNNER_TOKEN is not configured');
    return false;
  }

  const providedToken = request.headers.get('x-bot-runner-token');
  return providedToken === expectedToken;
}

async function handleRun(request: Request): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runDailyBots();

  return NextResponse.json({
    success: true,
    ran: result.ran,
    lockAcquired: result.lockAcquired,
    summary: result.summary,
  });
}

export async function GET(request: Request): Promise<NextResponse> {
  return handleRun(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  return handleRun(request);
}
