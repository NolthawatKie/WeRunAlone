import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { data: plan, error } = await supabase
    .from('community_plans')
    .select('download_count, plan_data')
    .eq('id', params.id)
    .single();

  if (error || !plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  await supabase
    .from('community_plans')
    .update({ download_count: plan.download_count + 1 })
    .eq('id', params.id);

  return NextResponse.json({ plan_data: plan.plan_data });
}
