import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ensureBookingSeedData, upsertCustomerProfile } from "@/lib/booking";
import { resolveErrorResponse } from "@/lib/errors";
import { verifyPassword, hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  createSessionToken,
  getSessionFromRequest,
  setSessionCookie,
} from "@/lib/session";

const customerSessionSchema = z.object({
  action: z.enum(["login", "register"]).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("E-mail invalido."),
  password: z.string().trim().min(1),
});

function getCustomerDelegate() {
  const customerDelegate = prisma.customer;

  if (!customerDelegate || typeof customerDelegate.findUnique !== "function") {
    throw new Error(
      'O servidor precisa ser reiniciado para atualizar o login de clientes. Pare o "yarn dev" e rode novamente.',
    );
  }

  return customerDelegate;
}

export async function POST(request: NextRequest) {
  try {
    await ensureBookingSeedData();

    const parsedBody = customerSessionSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "E-mail e senha sao obrigatorios para acessar o agendamento." },
        { status: 400 },
      );
    }

    const action = parsedBody.data.action ?? "login";
    const name = parsedBody.data.name;
    const phone = parsedBody.data.phone?.replace(/\D/g, "");
    const email = parsedBody.data.email;
    const password = parsedBody.data.password;

    if (action === "register" && password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 },
      );
    }

    let customer;
    const customerDelegate = getCustomerDelegate();

    if (action === "register") {
      if (!name) {
        return NextResponse.json(
          { error: "Nome e obrigatorio para criar sua conta." },
          { status: 400 },
        );
      }

      if (!phone) {
        return NextResponse.json(
          { error: "WhatsApp e obrigatorio para criar sua conta." },
          { status: 400 },
        );
      }

      const existingCustomer = await customerDelegate.findFirst({
        where: { email },
      });

      if (existingCustomer?.passwordHash) {
        return NextResponse.json(
          { error: "Ja existe uma conta com este e-mail. Faça login." },
          { status: 400 },
        );
      }

      const profile = await upsertCustomerProfile({
        name,
        phone,
        email,
      });

      customer = await customerDelegate.update({
        where: { id: profile.id },
        data: {
          name,
          email: email || null,
          passwordHash: hashPassword(password),
        },
      });
    } else {
      customer = await customerDelegate.findFirst({
        where: { email },
      });

      if (!customer?.passwordHash) {
        return NextResponse.json(
          { error: "Conta nao encontrada. Crie sua conta para continuar." },
          { status: 400 },
        );
      }

      const isValidPassword = verifyPassword(password, customer.passwordHash);

      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Senha incorreta. Tente novamente." },
          { status: 400 },
        );
      }
    }

    const token = await createSessionToken({ id: customer.id, role: customer.role });
    const response = NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        role: customer.role,
      },
    });
    setSessionCookie(response, token);

    return response;
  } catch (error) {
    const { message, status } = resolveErrorResponse(
      error,
      "Nao foi possivel autenticar o cliente.",
    );
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ customer: null });
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.id } });

  if (!customer) {
    const response = NextResponse.json({ customer: null });
    clearSessionCookie(response);
    return response;
  }

  return NextResponse.json({
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      role: customer.role,
    },
  });
}

export async function DELETE() {
  const response = NextResponse.json({ message: "Sessao encerrada." });
  clearSessionCookie(response);
  return response;
}
