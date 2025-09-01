export function extractTenantFromSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}

export function buildTenantUrl(subdomain: string, baseDomain: string = 'localhost:3000'): string {
  return `https://${subdomain}.${baseDomain}`;
}

export function generateTenantSchema(tenantId: string): string {
  return `tenant_${tenantId.replace(/-/g, '_')}`;
}