import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get('target');
  const level = searchParams.get('level');
  const weeksParam = searchParams.get('weeks');
  const weeksNearParam = searchParams.get('weeksNear');

  let query = supabase
    .from('community_plans')
    .select(
      'id, target, level, weeks, run_days, hr_max, plan_name, shared_by, download_count, created_at',
    );

  if (target) query = query.eq('target', target);
  if (level) query = query.eq('level', level);
  if (weeksParam) query = query.eq('weeks', parseInt(weeksParam));

  if (weeksNearParam) {
    const w = parseInt(weeksNearParam);
    query = query.gte('weeks', w - 2).lte('weeks', w + 2);
    query = query.order('download_count', { ascending: false }).limit(3);
  } else {
    query = query.order('created_at', { ascending: false }).limit(100);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[community/list]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
