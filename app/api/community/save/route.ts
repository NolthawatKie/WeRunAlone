import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1';
  const today = new Date().toISOString().split('T')[0];

  // Check rate limit (max 3 shares/IP/day)
  const { data: rateRow } = await supabase
    .from('share_rate_limit')
    .select('id, count')
    .eq('ip', ip)
    .eq('date', today)
    .maybeSingle();

  if (rateRow && rateRow.count >= 3) {
    return NextResponse.json(
      { error: 'Rate limit exceeded: max 3 shares per day' },
      { status: 429 },
    );
  }

  const body = await req.json();
  const { target, level, weeks, run_days, hr_max, plan_data, plan_name, shared_by } = body;

  if (!target || !level || !weeks || !plan_data || !plan_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('community_plans')
    .insert({
      target,
      level,
      weeks,
      run_days: run_days ?? [],
      hr_max: hr_max ?? null,
      plan_data,
      plan_name,
      shared_by: shared_by?.trim() || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[community/save]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update rate limit row
  if (rateRow) {
    await supabase
      .from('share_rate_limit')
      .update({ count: rateRow.count + 1 })
      .eq('id', rateRow.id);
  } else {
    await supabase.from('share_rate_limit').insert({ ip, date: today, count: 1 });
  }

  return NextResponse.json({ id: data.id, success: true });
}
