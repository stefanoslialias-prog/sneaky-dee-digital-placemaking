import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Validate API key from header
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required in x-api-key header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hash the API key and validate
    const encoder = new TextEncoder()
    const data = encoder.encode(apiKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const { data: apiKeyRecord, error: keyError } = await supabase
      .from('api_keys')
      .select('id, location_id, active')
      .eq('key_hash', keyHash)
      .eq('active', true)
      .single()

    if (keyError || !apiKeyRecord) {
      console.error('Invalid API key:', keyError)
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update last_used_at
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyRecord.id)

    // Parse incoming payload (flexible format)
    const payload = await req.json()
    console.log('Received payload:', payload)

    // Extract data - try common field names from different vendors
    const deviceCount = 
      payload.device_count || 
      payload.deviceCount || 
      payload.client_count || 
      payload.clientCount ||
      payload.num_clients ||
      payload.connected_devices ||
      payload.devices ||
      0

    const timestamp = payload.timestamp || new Date().toISOString()
    const locationId = payload.location_id || apiKeyRecord.location_id

    if (!locationId) {
      return new Response(
        JSON.stringify({ error: 'location_id required in payload or API key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Store traffic data
    const { data: trafficData, error: insertError } = await supabase
      .from('location_traffic')
      .insert({
        location_id: locationId,
        device_count: deviceCount,
        timestamp: timestamp,
        metadata: payload // Store entire payload for vendor-specific data
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to store traffic data', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Traffic data stored:', trafficData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Traffic data received',
        data: trafficData 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})