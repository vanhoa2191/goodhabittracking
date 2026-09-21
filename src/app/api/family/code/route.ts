import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function retiredPairingResponse() {
  return NextResponse.json(
    {
      success: false,
      error: 'Legacy pairing is disabled',
    },
    { status: 404 }
  );
}

export async function POST(request?: NextRequest) {
  void request;
  return retiredPairingResponse();
}

export async function GET(request?: NextRequest) {
  void request;
  return retiredPairingResponse();
}
