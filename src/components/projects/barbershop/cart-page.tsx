"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import cartStyles from "./cart-page.module.css";
import { FooterSection, Header } from "./home-page";
import { readBookingCart, readProductCart, writeBookingCart, writeProductCart } from "./cart-storage";
import { products } from "./store-data";
import { useSiteConfig } from "./use-site-config";

const styles = cartStyles;

type BookingCartItem = {
  id: string;
  serviceName: string;
  barberName: string;
  barberImage: string;
  date: string;
  time: string;
  endTime: string;
  price: string;
  duration: string;
  preferSilent: boolean;
  notes: string;
};

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

function parsePriceToNumber(price: string) {
  const normalized = price.replace(/[^\d,]/g, "").replace(",", ".");
  return Number(normalized || "0");
}

export function CartPage() {
  const config = useSiteConfig();
  const [items, setItems] = useState<BookingCartItem[]>(() => readBookingCart<BookingCartItem>());
  const [productIds, setProductIds] = useState<string[]>(() => readProductCart());

  const selectedProducts = useMemo(
    () => products.filter((product) => productIds.includes(product.id)),
    [productIds],
  );

  const total = useMemo(
    () =>
      (
        items.reduce((sum, item) => sum + parsePriceToNumber(item.price), 0) +
        selectedProducts.reduce((sum, item) => sum + parsePriceToNumber(item.price), 0)
      ).toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL",
        },
      ),
    [items, selectedProducts],
  );

  function removeItem(id: string) {
    setItems((current) => {
      const nextItems = current.filter((item) => item.id !== id);
      writeBookingCart(nextItems);
      return nextItems;
    });
  }

  function removeProduct(productId: string) {
    setProductIds((current) => {
      const nextItems = current.filter((item) => item !== productId);
      writeProductCart(nextItems);
      return nextItems;
    });
  }

  function clearCart() {
    writeBookingCart([]);
    writeProductCart([]);
    setItems([]);
    setProductIds([]);
  }

  return (
    <div className={styles.page}>
      <section className={styles.heroShell}>
        <Header config={config} homeLinks />
        <main className={styles.main}>
          <div className={styles.intro}>
            <span>Seu carrinho</span>
            <h1>Revise os serviços antes de seguir com o agendamento.</h1>
            <p>
              Aqui você pode conferir os serviços adicionados, remover itens e
              voltar para incluir novos atendimentos.
            </p>
          </div>

          {items.length === 0 && selectedProducts.length === 0 ? (
            <div className={styles.emptyCard}>
              <strong>Carrinho vazio</strong>
              <p>
                Você ainda não adicionou serviços. Volte para a tela de
                agendamento e inclua os atendimentos que deseja reservar.
              </p>
              <Link className={styles.primaryButton} href="/agendamento">
                Voltar para agendamento
              </Link>
            </div>
          ) : (
            <div className={styles.cartLayout}>
              <div className={styles.cartList}>
                {items.map((item) => (
                  <article className={styles.cartItem} key={item.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={styles.cartImage} src={item.barberImage} alt={item.barberName} />
                    <div className={styles.cartBody}>
                      <strong>{item.serviceName}</strong>
                      <span>
                        {formatDateLabel(item.date)} · {item.time} - {item.endTime}
                      </span>
                      <span>{item.barberName}</span>
                      <div className={styles.cartMeta}>
                        <span>{item.price}</span>
                        <span>{item.duration}</span>
                        {item.preferSilent ? <span>Atendimento silencioso</span> : null}
                      </div>
                      {item.notes ? <span>Observações: {item.notes}</span> : null}
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={() => removeItem(item.id)}
                      type="button"
                    >
                      Remover
                    </button>
                  </article>
                ))}
                {selectedProducts.map((product) => (
                  <article className={styles.cartItem} key={product.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={styles.cartImage} src={product.image} alt={product.name} />
                    <div className={styles.cartBody}>
                      <strong>{product.name}</strong>
                      <span>{product.description}</span>
                      <div className={styles.cartMeta}>
                        <span>{product.price}</span>
                        <span>Produto</span>
                        <span>{product.stock} em estoque</span>
                      </div>
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={() => removeProduct(product.id)}
                      type="button"
                    >
                      Remover
                    </button>
                  </article>
                ))}
              </div>

              <aside className={styles.summaryCard}>
                <strong>Resumo</strong>
                <div className={styles.summaryRow}>
                  <span>Itens</span>
                  <strong>{items.length + selectedProducts.length}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Total estimado</span>
                  <strong>{total}</strong>
                </div>
                <p>
                  O próximo passo é ligar esse carrinho a uma confirmação em
                  lote. Hoje ele já organiza os serviços que você quer reservar.
                </p>
                <div className={styles.summaryActions}>
                  <Link className={styles.primaryButton} href="/agendamento">
                    Adicionar mais serviços
                  </Link>
                  <button className={styles.secondaryButton} onClick={clearCart} type="button">
                    Limpar carrinho
                  </button>
                </div>
              </aside>
            </div>
          )}

          <FooterSection />
        </main>
      </section>
    </div>
  );
}
