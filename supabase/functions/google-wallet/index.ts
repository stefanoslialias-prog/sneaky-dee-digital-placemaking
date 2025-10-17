import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SignJWT, importPKCS8 } from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_WALLET_API_URL = "https://walletobjects.googleapis.com/walletobjects/v1";
const ISSUER_ID = Deno.env.get('GOOGLE_WALLET_ISSUER_ID');
const CLASS_SUFFIX = Deno.env.get('GOOGLE_WALLET_CLASS_ID');

interface CouponData {
  id: string;
  title: string;
  code: string;
  discount: string;
  validUntil: string;
  description?: string;
}

/**
 * Generates a Google OAuth access token using service account credentials
 */
async function getGoogleAuthToken(): Promise<string> {
  const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  let privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');

  if (!serviceAccountEmail || !privateKey) {
    throw new Error("Missing Google service account credentials");
  }

  // Format the private key properly for JWT signing
  privateKey = privateKey.replace(/\\n/g, "\n").replace(/"/g, "").trim();
  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
  }

  const now = Math.floor(Date.now() / 1000);

  // Import the private key for Deno
  const cryptoKey = await importPKCS8(privateKey, "RS256");

  const jwt = await new SignJWT({
    iss: serviceAccountEmail,
    scope: "https://www.googleapis.com/auth/wallet_object.issuer",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })
    .setProtectedHeader({ alg: "RS256" })
    .sign(cryptoKey);

  // Exchange JWT for access token
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Failed to get Google OAuth token: ${resp.status} ${errorText}`);
  }

  const data = await resp.json();
  return data.access_token;
}

/**
 * Ensures a Google Wallet class exists, creating it if necessary
 */
async function ensureGenericClass(accessToken: string): Promise<string> {
  const classId = `${ISSUER_ID}.${CLASS_SUFFIX}`;

  // Check if class already exists
  const getResp = await fetch(
    `${GOOGLE_WALLET_API_URL}/genericClass/${classId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      method: "GET",
    }
  );

  if (getResp.ok) {
    console.log("Wallet class already exists:", classId);
    return classId;
  }

  // Create class if it doesn't exist
  console.log("Creating new wallet class:", classId);
  const createPayload = {
    id: classId,
    issuerName: "Digital Placemaking",
    programName: "Coupon Program",
    reviewStatus: "underReview",
    cardTitle: {
      defaultValue: { language: "en-US", value: "Digital Placemaking Coupon" },
    },
    logo: {
      sourceUri: {
        uri: "https://placehold.co/200x200/000000/FFFFFF/png?text=DP",
      },
    },
  };

  const createResp = await fetch(`${GOOGLE_WALLET_API_URL}/genericClass`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createPayload),
  });

  if (!createResp.ok) {
    const err = await createResp.text();
    throw new Error(`Failed to create GenericClass: ${err}`);
  }

  console.log("Wallet class created successfully:", classId);
  return classId;
}

/**
 * Builds a Google Wallet GenericObject payload from coupon data
 */
function buildGenericObjectPayload(classId: string, coupon: CouponData) {
  const now = new Date();
  const validUntil = new Date(coupon.validUntil);
  const timestamp = Date.now();
  const objectId = `${ISSUER_ID}.coupon${timestamp}`;

  return {
    id: objectId,
    classId,
    state: "active",
    cardTitle: {
      defaultValue: {
        language: "en-US",
        value: String(coupon.title ?? "Coupon"),
      },
    },
    header: {
      defaultValue: {
        language: "en-US",
        value: String(coupon.title ?? "Coupon"),
      },
    },
    subheader: {
      defaultValue: {
        language: "en-US",
        value: String(coupon.discount ?? "Discount"),
      },
    },
    logo: {
      sourceUri: {
        uri: "https://placehold.co/200x200/000000/FFFFFF/png?text=DP",
      },
    },
    heroImage: {
      sourceUri: {
        uri: "https://placehold.co/600x400/4F46E5/FFFFFF/png?text=Coupon",
      },
    },
    barcode: {
      type: "qrCode",
      value: String(coupon.code ?? ""),
      alternateText: String(coupon.code ?? ""),
    },
    validTimeInterval: {
      start: { date: now.toISOString() },
      end: { date: validUntil.toISOString() },
    },
    textModulesData: [
      {
        header: "Coupon Code",
        body: String(coupon.code ?? ""),
        id: "coupon_code",
      },
      {
        header: "Discount",
        body: String(coupon.discount ?? ""),
        id: "discount",
      },
      {
        header: "Valid Until",
        body: String(coupon.validUntil ?? ""),
        id: "valid_until",
      },
      ...(coupon.description
        ? [
            {
              header: "Description",
              body: String(coupon.description),
              id: "description",
            },
          ]
        : []),
    ],
    linksModuleData: {
      uris: [
        {
          uri: "https://digitalplacemaking.com",
          description: "Digital Placemaking",
          id: "website",
        },
      ],
    },
    messages: coupon.title
      ? [
          {
            header: String(coupon.title),
            body: String(coupon.description ?? ""),
            actionUri: { uri: "https://digitalplacemaking.com" },
          },
        ]
      : [],
  };
}

/**
 * Generates a signed JWT for the Save-to-Wallet flow
 */
async function buildSaveJwt(objectIdOrObject: { id: string } | Record<string, any>): Promise<string> {
  const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')!;
  let privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY')!;

  // Format private key for JWT signing
  privateKey = privateKey.replace(/\\n/g, "\n").replace(/"/g, "").trim();
  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
  }

  const now = Math.floor(Date.now() / 1000);

  // Import the private key for Deno
  const cryptoKey = await importPKCS8(privateKey, "RS256");

  const jwt = await new SignJWT({
    iss: serviceAccountEmail,
    aud: "google",
    typ: "savetowallet",
    iat: now,
    payload: {
      genericObjects: [objectIdOrObject],
    },
  })
    .setProtectedHeader({ alg: "RS256" })
    .sign(cryptoKey);

  return jwt;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment configuration
    if (!ISSUER_ID || !CLASS_SUFFIX) {
      console.error("Missing environment variables - ISSUER_ID or CLASS_SUFFIX");
      return new Response(
        JSON.stringify({
          error: "Google Wallet API not configured. Missing issuer/class environment variables.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const coupon: CouponData = await req.json();
    if (!coupon?.title || !coupon?.code || !coupon?.validUntil) {
      return new Response(
        JSON.stringify({
          error: "Missing required coupon fields: title, code, validUntil",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log("Creating wallet pass for coupon:", coupon.title);

    // Step 1: Get OAuth access token
    const accessToken = await getGoogleAuthToken();

    // Step 2: Ensure wallet class exists
    const classId = await ensureGenericClass(accessToken);

    // Step 3: Build wallet object payload
    const objectPayload = buildGenericObjectPayload(classId, coupon);

    console.log("Creating wallet object with ID:", objectPayload.id);

    // Step 4: Create wallet object
    const objectCreateResp = await fetch(
      `${GOOGLE_WALLET_API_URL}/genericObject`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(objectPayload),
      }
    );

    console.log("Object creation response status:", objectCreateResp.status);

    let objectResult: any;
    if (objectCreateResp.ok) {
      objectResult = await objectCreateResp.json();
      console.log("Object creation successful:", objectResult.id);
    } else {
      const responseText = await objectCreateResp.text();
      console.log("Object creation response body:", responseText);

      // Handle conflict (object already exists)
      if (objectCreateResp.status === 409) {
        console.log("Object already exists, retrieving...");
        const getResp = await fetch(
          `${GOOGLE_WALLET_API_URL}/genericObject/${objectPayload.id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!getResp.ok) {
          return new Response(
            JSON.stringify({
              error: "Failed to retrieve existing wallet object",
              details: await getResp.text(),
            }),
            {
              status: getResp.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        objectResult = await getResp.json();
        console.log("Retrieved existing object:", objectResult.id);
      } else {
        return new Response(
          JSON.stringify({
            error: "Failed to create wallet object",
            details: responseText,
          }),
          {
            status: objectCreateResp.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Step 5: Generate Save-to-Wallet URL
    const saveJwt = await buildSaveJwt({ id: objectResult.id });
    const saveUrl = `https://pay.google.com/gp/v/save/${saveJwt}`;

    console.log("Wallet pass created successfully:", objectResult.id);

    return new Response(
      JSON.stringify({
        success: true,
        passId: objectResult.id,
        saveUrl,
        message: `"${coupon.title}" is ready to save to Google Wallet.`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error("Wallet API error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
