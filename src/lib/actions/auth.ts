"use server";

import { createHash, randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { type Profile } from "@/lib/utils/auth";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validations/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function login(data: LoginInput) {
  const supabase = await createClient();

  // Validate input
  const validatedFields = loginSchema.safeParse(data);
  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    };
  }

  const { email, password } = validatedFields.data;

  // Sign in with Supabase
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  let isAdmin = authData.user?.user_metadata?.role === "admin";

  if (authData.user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_blocked")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profile?.is_blocked) {
      await supabase.auth.signOut();
      return {
        error: "Your account is blocked. Please contact an administrator.",
      };
    }

    isAdmin = profile?.role === "admin" || isAdmin;
  }

  revalidatePath("/", "layout");

  const loginToken = randomUUID();
  const targetPath = isAdmin ? "/dashboard/admin" : "/dashboard";
  redirect(`${targetPath}?loginToken=${loginToken}`);
}

export async function register(data: RegisterInput) {
  const supabase = await createClient();

  // Validate input
  const validatedFields = registerSchema.safeParse(data);
  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    };
  }

  const { email, password, fullName, codename, schoolId, inviteToken } =
    validatedFields.data;

  let role: "student" | "psg_member" = "student";

  if (inviteToken) {
    const tokenHash = createHash("sha256").update(inviteToken).digest("hex");
    const { data: isInviteConsumed, error: inviteError } = await supabase.rpc(
      "consume_psg_invite",
      {
        p_token_hash: tokenHash,
        p_used_email: email,
      },
    );

    if (inviteError || !isInviteConsumed) {
      return {
        error: "Invalid or expired PSG invite link",
      };
    }

    role = "psg_member";
  }

  const profileDisplayName =
    role === "psg_member" ? (codename || "").trim() : (fullName || "").trim();

  if (profileDisplayName.length < 2) {
    return {
      error:
        role === "psg_member"
          ? "Codename is required"
          : "Full name is required",
    };
  }

  // Sign up with Supabase
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        codename,
        school_id: schoolId,
        role,
      },
    },
  });

  if (signUpError) {
    return {
      error: signUpError.message,
    };
  }

  // Create profile entry
  if (authData.user) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      email,
      full_name: profileDisplayName,
      school_id: schoolId,
      role,
    });

    if (profileError) {
      return {
        error: "Failed to create user profile: " + profileError.message,
      };
    }
  }

  // Sign out the user after registration
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login?registered=true");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?loggedOut=true");
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch profile with role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile) {
    return profile;
  }

  // Heal missing profile rows to avoid auth redirect loops.
  const fallbackProfile: Profile = {
    id: user.id,
    email: user.email ?? "",
    full_name:
      (typeof user.user_metadata?.full_name === "string" &&
        user.user_metadata.full_name) ||
      (user.email?.split("@")[0] ?? "User"),
    role:
      user.user_metadata?.role === "admin" ||
      user.user_metadata?.role === "psg_member" ||
      user.user_metadata?.role === "student"
        ? user.user_metadata.role
        : "student",
    school_id:
      typeof user.user_metadata?.school_id === "string"
        ? user.user_metadata.school_id
        : null,
    codename:
      typeof user.user_metadata?.codename === "string"
        ? user.user_metadata.codename
        : null,
    avatar_url:
      typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : null,
    is_blocked: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: createdProfile } = await supabase
    .from("profiles")
    .upsert(fallbackProfile)
    .select("*")
    .single();

  return createdProfile ?? fallbackProfile;
}

export async function getCurrentUserProfile() {
  const profile = await getUser();

  if (!profile) {
    return {
      success: false,
      error: "Please login first",
    };
  }

  return {
    success: true,
    data: profile,
  };
}

export async function updateCurrentUserProfile(input: {
  full_name: string;
  codename?: string | null;
  school_id?: string | null;
  avatar_url?: string | null;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Please login first",
      };
    }

    const fullName = input.full_name.trim();
    const codename = (input.codename || "").trim();
    const schoolId = (input.school_id || "").trim();
    const avatarUrl = (input.avatar_url || "").trim();

    if (fullName.length < 2) {
      return {
        success: false,
        error: "Full name must be at least 2 characters",
      };
    }

    const updateData: Partial<Profile> = {
      full_name: fullName,
      codename: codename || null,
      school_id: schoolId || null,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select("*")
      .single();

    if (updateError || !updatedProfile) {
      console.error("Error updating current profile:", updateError);
      return {
        success: false,
        error: "Failed to update profile",
      };
    }

    // Keep auth metadata aligned with profile information.
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        codename: codename || null,
        school_id: schoolId || null,
        avatar_url: avatarUrl || null,
      },
    });

    if (metadataError) {
      console.error("Error syncing auth metadata:", metadataError);
    }

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/profile");

    return {
      success: true,
      data: updatedProfile as Profile,
    };
  } catch (error) {
    console.error("Unexpected error updating current profile:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function updateCurrentUserPassword(input: {
  old_password: string;
  new_password: string;
  confirm_new_password: string;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return {
        success: false,
        error: "Please login first",
      };
    }

    const oldPassword = input.old_password;
    const newPassword = input.new_password;
    const confirmNewPassword = input.confirm_new_password;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return {
        success: false,
        error: "All password fields are required",
      };
    }

    if (newPassword !== confirmNewPassword) {
      return {
        success: false,
        error: "New password and confirmation do not match",
      };
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        error: "New password must be at least 8 characters",
      };
    }

    if (oldPassword === newPassword) {
      return {
        success: false,
        error: "New password must be different from old password",
      };
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });

    if (verifyError) {
      return {
        success: false,
        error: "Old password is incorrect",
      };
    }

    const { error: updatePasswordError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updatePasswordError) {
      console.error("Error updating user password:", updatePasswordError);
      return {
        success: false,
        error: "Failed to update password",
      };
    }

    revalidatePath("/dashboard/profile");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error updating current user password:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
