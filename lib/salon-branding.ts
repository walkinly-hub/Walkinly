export type SalonBranding = {
  logoUrl?: string;
  backgroundColor: string;
  surfaceColor: string;
  foregroundColor: string;
  mutedForegroundColor: string;
  primaryColor: string;
  primaryHoverColor: string;
  borderColor: string;
};

const defaultBranding: SalonBranding = {
  backgroundColor: "#f8f7f4",
  surfaceColor: "#ffffff",
  foregroundColor: "#1d1d1f",
  mutedForegroundColor: "#71717a",
  primaryColor: "#ec4899",
  primaryHoverColor: "#db2777",
  borderColor: "#e7e5e4",
};

function getColor(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value
    : fallback;
}

export function parseSalonBranding(value: unknown): SalonBranding {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaultBranding;
  }

  const branding = value as Record<string, unknown>;
  const logoUrl = branding.logo_url;

  return {
    logoUrl:
      typeof logoUrl === "string" && /^https:\/\//.test(logoUrl)
        ? logoUrl
        : undefined,
    backgroundColor: getColor(branding.background_color, defaultBranding.backgroundColor),
    surfaceColor: getColor(branding.surface_color, defaultBranding.surfaceColor),
    foregroundColor: getColor(branding.foreground_color, defaultBranding.foregroundColor),
    mutedForegroundColor: getColor(
      branding.muted_foreground_color,
      defaultBranding.mutedForegroundColor,
    ),
    primaryColor: getColor(branding.primary_color, defaultBranding.primaryColor),
    primaryHoverColor: getColor(
      branding.primary_hover_color,
      defaultBranding.primaryHoverColor,
    ),
    borderColor: getColor(branding.border_color, defaultBranding.borderColor),
  };
}
