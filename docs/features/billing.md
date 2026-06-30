# Billing

## What it is
Shipflow monetizes via subscriptions, utilizing Razorpay as its payment gateway. The Billing feature handles plan selection, checkout session generation, and webhook-based subscription state syncing.

## How it works
- **Integration**: Handled by the `billing` tRPC router (`packages/trpc/server/routes/billing`).
- **Checkout**: When a user selects a Pro or Enterprise plan, the API generates a Razorpay order/checkout session.
- **Webhooks**: Once the user completes the payment, Razorpay sends a webhook to Shipflow. Shipflow verifies the signature and updates the Organization's billing status in the database (`packages/db`).
- **Access Control**: Depending on the active plan, certain premium features (like AI Task Execution or higher member limits) are gated or unlocked.

## API surface
| Endpoint (tRPC) | Description |
|-----------------|-------------|
| `billing.createCheckout` | Creates a Razorpay checkout session for a plan. |
| `billing.getStatus` | Returns the current billing status for the org. |
| `billing.manage` | Generates a link to the Razorpay customer portal. |

*(For full REST endpoint mappings, refer to the API Reference at `/api/docs`)*

## Configuration
Requires Razorpay integration keys:
- `RAZORPAY_KEY_ID`: Your Razorpay public key ID.
- `RAZORPAY_KEY_SECRET`: Your Razorpay secret key.
- `RAZORPAY_WEBHOOK_SECRET`: The secret used to verify incoming webhooks from Razorpay.
- `RAZORPAY_PRO_PLAN_ID` / `ENTERPRISE_PLAN_ID`: The exact Plan IDs configured in the Razorpay dashboard.

## Example
**Creating a checkout session via SDK:**
```typescript
const { data: checkoutUrl } = trpc.billing.createCheckout.useQuery({
  orgId: "org_123",
  planId: process.env.RAZORPAY_PRO_PLAN_ID
});

// Redirect client to checkoutUrl
window.location.href = checkoutUrl;
```

## Limits & edge cases
- **Security**: Webhooks must be verified cryptographically. Unverified webhooks are discarded.
- **Failures**: If a payment fails or a subscription expires, the webhook updates the database to downgrade the organization, locking premium features automatically.

## Related features
- [Organization and Members](organization-and-members.md)
