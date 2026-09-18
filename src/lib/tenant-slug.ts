import { prisma } from "@/lib/prisma";

const BASE_DOMAIN = "dabitech.com.br";

function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return slug || "barbearia";
}

export async function generateTenantDomain(businessName: string) {
  const baseSlug = slugify(businessName);
  let candidate = `${baseSlug}.${BASE_DOMAIN}`;
  let suffix = 2;

  while (await prisma.tenant.findUnique({ where: { domain: candidate } })) {
    candidate = `${baseSlug}-${suffix}.${BASE_DOMAIN}`;
    suffix += 1;
  }

  return candidate;
}
