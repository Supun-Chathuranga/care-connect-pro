import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      console.log("Invalid token or user not found:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    if (roleError || roleData?.role !== "admin") {
      console.log("User is not an admin:", roleError);
      return new Response(
        JSON.stringify({ error: "Only admins can create doctors" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      email,
      password,
      fullName,
      phone,
      specialty,
      qualification,
      experienceYears,
      consultationFee,
      bio,
    } = body;

    console.log("Creating doctor with email:", email);

    // Validate required fields
    if (!email || !password || !fullName || !phone || !specialty || !qualification) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the auth user using admin API
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        full_name: fullName,
        phone: phone,
        role: "doctor",
      },
    });

    if (createUserError) {
      console.error("Error creating auth user:", createUserError);
      return new Response(
        JSON.stringify({ error: createUserError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!authData.user) {
      console.error("No user returned from auth.admin.createUser");
      return new Response(
        JSON.stringify({ error: "Failed to create user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Auth user created:", authData.user.id);

    // Create profile
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      user_id: authData.user.id,
      full_name: fullName,
      phone: phone,
      email: email,
    });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Don't fail completely, but log it
    }

    // Create user role
    const { error: roleInsertError } = await supabaseAdmin.from("user_roles").insert({
      user_id: authData.user.id,
      role: "doctor",
    });

    if (roleInsertError) {
      console.error("Error creating user role:", roleInsertError);
    }

    // Create doctor record
    const { data: doctorData, error: doctorError } = await supabaseAdmin.from("doctors").insert({
      user_id: authData.user.id,
      specialty: specialty,
      qualification: qualification,
      experience_years: experienceYears || 0,
      consultation_fee: consultationFee || 0,
      bio: bio || null,
      is_active: true,
    }).select().single();

    if (doctorError) {
      console.error("Error creating doctor record:", doctorError);
      return new Response(
        JSON.stringify({ error: doctorError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Doctor created successfully:", doctorData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        doctor: doctorData,
        userId: authData.user.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
