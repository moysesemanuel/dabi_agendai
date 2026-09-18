import { UserFacingError } from "@/lib/errors";
import { isPlanId } from "@/lib/billing/plans";
import { createTenantWithAdmin } from "@/lib/platform";
import { prisma } from "@/lib/prisma";

function printUsageAndExit(): never {
  console.error(
    "Uso: yarn create-tenant --name \"Nome da barbearia\" --domain dominio.com --admin-name \"Nome\" --admin-email email@dominio.com --admin-phone 11999999999 --admin-password <senha> --plan essencial|completo",
  );
  process.exit(1);
}

function parseArgs(argv: string[]) {
  const values: Record<string, string> = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (!arg.startsWith("--")) {
      continue;
    }

    const key = arg.slice(2);
    const value = argv[i + 1];

    if (!value || value.startsWith("--")) {
      printUsageAndExit();
    }

    values[key] = value;
    i += 1;
  }

  const name = values["name"];
  const domain = values["domain"];
  const adminName = values["admin-name"];
  const adminEmail = values["admin-email"];
  const adminPhone = values["admin-phone"];
  const adminPassword = values["admin-password"];
  const planId = values["plan"];

  if (!name || !domain || !adminName || !adminEmail || !adminPhone || !adminPassword || !planId) {
    printUsageAndExit();
  }

  if (adminPassword.length < 6) {
    console.error("A senha do admin deve ter pelo menos 6 caracteres.");
    process.exit(1);
  }

  if (!isPlanId(planId)) {
    console.error("--plan deve ser \"essencial\" ou \"completo\".");
    process.exit(1);
  }

  return { name, domain, adminName, adminEmail, adminPhone, adminPassword, planId };
}

async function main() {
  const { name, domain, adminName, adminEmail, adminPhone, adminPassword, planId } = parseArgs(
    process.argv.slice(2),
  );

  const { tenant, admin } = await createTenantWithAdmin({
    name,
    domain,
    adminName,
    adminEmail,
    adminPhone,
    adminPassword,
    planId,
  });

  console.log("Tenant criado com sucesso:");
  console.log(`  id: ${tenant.id}`);
  console.log(`  nome: ${tenant.name}`);
  console.log(`  dominio: ${tenant.domain}`);
  console.log("Admin criado com sucesso:");
  console.log(`  id: ${admin.id}`);
  console.log(`  email: ${admin.email}`);
  console.log("");
  console.log(
    "Site criado com um servico e um profissional de placeholder. O admin deve personalizar tudo pelo painel /admin depois do primeiro login.",
  );
}

main()
  .catch((error) => {
    if (error instanceof UserFacingError) {
      console.error(error.message);
    } else {
      console.error("Falha ao criar o tenant:", error);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
