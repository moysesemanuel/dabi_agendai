// Erro pensado para ser mostrado ao usuario (regra de negocio conhecida).
// Qualquer outro erro (Prisma, bug inesperado) e logado no servidor e
// devolvido ao cliente com uma mensagem generica, sem detalhes internos.
export class UserFacingError extends Error {}

const GENERIC_ERROR_MESSAGE = "Nao foi possivel concluir a operacao. Tente novamente.";

export function resolveErrorResponse(error: unknown, fallbackMessage = GENERIC_ERROR_MESSAGE) {
  if (error instanceof UserFacingError) {
    return { message: error.message, status: 400 as const };
  }

  console.error(error);
  return { message: fallbackMessage, status: 500 as const };
}
