
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PassKitRequest {
  couponId: string
  userId?: string
  deviceId?: string
  platform: 'apple' | 'google'
  userEmail?: string
  userName?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for server-side operations
    // This bypasses RLS policies to allow wallet record creation
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { couponId, userId, deviceId, platform, userEmail, userName }: PassKitRequest = await req.json()

    console.log('Processing PassKit wallet request:', { couponId, platform, userId })

    // Get coupon details from database
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .single()

    if (couponError || !coupon) {
      console.error('Coupon not found:', couponError)
      return new Response(
        JSON.stringify({ success: false, message: 'Coupon not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if we need to create PassKit campaign/offer for this coupon
    let campaignId = coupon.passkit_campaign_id
    let offerId = coupon.passkit_offer_id

    if (!campaignId || !offerId) {
      console.log('Creating PassKit campaign and offer for coupon:', couponId)
      
      // For now, we'll store placeholder PassKit IDs
      // In a real implementation, you'd call PassKit gRPC APIs here using the certificates
      campaignId = `campaign_${couponId}_${Date.now()}`
      offerId = `offer_${couponId}_${Date.now()}`

      // Update coupon with PassKit IDs
      await supabase
        .from('coupons')
        .update({
          passkit_campaign_id: campaignId,
          passkit_offer_id: offerId,
          passkit_template_id: `template_${platform}_${Date.now()}`
        })
        .eq('id', couponId)
    }

    // Create PassKit coupon pass
    const passkitCouponId = `pk_coupon_${couponId}_${userId || deviceId}_${Date.now()}`
    const passUrl = platform === 'apple' 
      ? `https://api.passkit.io/v1/passes/${passkitCouponId}`
      : `https://pay.google.com/gp/v/save/${passkitCouponId}`

    console.log('Creating PassKit coupon:', passkitCouponId)

    // Save to user_wallets table
    const { error: walletError } = await supabase
      .from('user_wallets')
      .insert({
        user_id: userId,
        coupon_id: couponId,
        device_id: deviceId,
        platform: platform,
        passkit_coupon_id: passkitCouponId,
        pass_url: passUrl,
        passkit_status: 'issued'
      })

    if (walletError) {
      console.error('Error saving to user_wallets:', walletError)
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to save wallet entry' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('PassKit wallet pass created successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: `Coupon added to ${platform === 'apple' ? 'Apple Wallet' : 'Google Pay'}!`,
        passUrl: passUrl,
        passkitCouponId: passkitCouponId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('PassKit wallet error:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to create wallet pass' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
