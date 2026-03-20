import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
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

  return NextResponse.json({ id: data.id, success: true });
}
