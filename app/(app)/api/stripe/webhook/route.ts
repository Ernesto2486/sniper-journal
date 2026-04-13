import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
  try {
    if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing webhook env vars" },
        { status: 500 },
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2026-03-25.dahlia",
    });

    const body = await req.text();
    const signature = (await headers()).get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const email =
          session.customer_details?.email ?? session.customer_email ?? null;
        const stripeCustomerId =
          typeof session.customer === "string" ? session.customer : null;
        const stripeSubscriptionId =
          typeof session.subscription === "string" ? session.subscription : null;

        if (!email) break;

        const { data: authUsers, error: authError } =
          await supabase.auth.admin.listUsers();

        if (authError) {
          console.error("Supabase listUsers error:", authError);
          break;
        }

        const matchedUser = authUsers.users.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase(),
        );

        if (!matchedUser) {
          console.warn("No Supabase user found for email:", email);
          break;
        }

        const { error: upsertError } = await supabase
          .from("user_subscriptions")
          .upsert(
            {
              user_id: matchedUser.id,
              email,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              subscription_status: "active",
              is_pro: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );

        if (upsertError) {
          console.error("Subscription upsert error:", upsertError);
        }

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.created":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId =
          typeof subscription.customer === "string" ? subscription.customer : null;

        if (!stripeCustomerId) break;

        const isPro =
          subscription.status === "active" || subscription.status === "trialing";

        const { error: updateError } = await supabase
          .from("user_subscriptions")
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            is_pro: isPro,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", stripeCustomerId);

        if (updateError) {
          console.error("Subscription status update error:", updateError);
        }

        break;
      }

      default:
        console.log("Unhandled Stripe event:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
}