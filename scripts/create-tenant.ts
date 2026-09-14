import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

function printUsageAndExit(): never {
  console.error(
    "Uso: yarn create-tenant --name \"Nome da barbearia\" --domain dominio.com --admin-name \"Nome\" --admin-email email@dominio.com --admin-phone 11999999999 --admin-password senha123",
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
  const domain = values["domain"]?.toLowerCase().trim();
  const adminName = values["admin-name"];
  const adminEmail = values["admin-email"]?.toLowerCase().trim();
  const adminPhone = values["admin-phone"]?.replace(/\D/g, "");
  const adminPassword = values["admin-password"];

  if (!name || !domain || !adminName || !adminEmail || !adminPhone || !adminPassword) {
    printUsageAndExit();
  }

  if (adminPassword.length < 6) {
    console.error("A senha do admin deve ter pelo menos 6 caracteres.");
    process.exit(1);
  }

  return { name, domain, adminName, adminEmail, adminPhone, adminPassword };
}

async function main() {
  const { name, domain, adminName, adminEmail, adminPhone, adminPassword } = parseArgs(
    process.argv.slice(2),
  );

  const existingTenant = await prisma.tenant.findUnique({ where: { domain } });

  if (existingTenant) {
    console.error(`Ja existe um tenant cadastrado para o dominio "${domain}".`);
    process.exit(1);
  }

  const tenant = await prisma.tenant.create({
    data: { name, domain },
  });

  const admin = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      passwordHash: hashPassword(adminPassword),
      role: "ADMIN",
    },
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
    "Nenhum servico/barbeiro foi criado ainda. O admin deve cadastrar os dados reais pelo painel /admin depois do primeiro login.",
  );
}

main()
  .catch((error) => {
    console.error("Falha ao criar o tenant:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
