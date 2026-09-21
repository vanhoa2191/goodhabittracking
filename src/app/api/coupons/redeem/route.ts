import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
const schema=z.object({code:z.string().trim().min(3).max(32)}).strict();
export async function POST(request:NextRequest){const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Mã không hợp lệ.'},{status:400});const supabase=await createServerSupabaseClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:'Vui lòng đăng nhập.'},{status:401});const{data,error}=await supabase.rpc('redeem_family_coupon',{coupon_code:parsed.data.code});if(error)return NextResponse.json({error:'Mã không tồn tại, đã dùng hoặc đã hết hạn.'},{status:400});return NextResponse.json({success:true,subscription:Array.isArray(data)?data[0]:data});}
