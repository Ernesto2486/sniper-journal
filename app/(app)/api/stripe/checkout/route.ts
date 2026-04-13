import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const priceId = process.env.STRIPE_PRICE_ID;

export async function POST() {
  try {
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 },
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2026-03-25.dahlia",
    });

    if (!priceId) {
      return NextResponse.json(
        { error: "Missing STRIPE_PRICE_ID" },
        { status: 500 },
      );
    }

    if (!siteUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SITE_URL" },
        { status: 500 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/dashboard?upgraded=true`,
      cancel_url: `${siteUrl}/dashboard?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}