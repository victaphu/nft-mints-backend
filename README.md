## Payment Gateway Integration

- We are using Stripe (for now) to integrate
- Two APIs are setup:
  - /v0/payment/hook: this is the payment hook from stripe. it is called whenever something happens on our gateway
  - /v0/payment/checkout: this is called by us to checkout and initiate a payment intent from stripe (pre-built checkout portal).

### Environment Variables

Look at env.example  
Setup the following:

```
STRIPE_ENDPOINT_SECRET=
STRIPE_API_KEY=
```

When you run command locally, it will print out a ENDPOINT_SECRET (which is for local testing). When configuring an actual endpoint, you will get the secret from the dashboard

### To setup stripe:

1. create account
2. install stripe cli (https://stripe.com/docs/stripe-cli)
3. run command `stripe login`
4. run command `stripe listen --forward-to localhost:3000/v0/payment/hook` (note: for local testing, deployed has different configuration setup at https://dashboard.stripe.com/test/webhooks/create?endpoint_location=hosted)
5. test by sending: `stripe trigger payment_intent.succeeded --add "payment_intent:metadata['key']=thisismymetadatakey"`

### To checkout

/v0/payment/checkout  
| Param | Desc | Example |
|---|---|---|
| tokenAddress | Token Address to purchase | 0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D |
| tokenId | Token Id to purchase | 123 |
| mobileNumber | Mobile number (must be able to send SMS to this) | 61123123123 |
| smsCode | SMS Code sent for verification | 12345 |
| successUrl | URL to redirect on successful payment | |
| cancelUrl | URL to redirect to when payment is cancelled | |

Note checkout is a post; when you post to this URL it will create a payment intent in Stripe and redirect user to the Stripe pre-built checkout page. Once payment is received Stripe will redirect back to success/cancel page depending on the success

For testing:

- Success: 4242 4242 4242 4242
- Requires Authentication: 4000 0025 0000 3155
- Failure: 4000 0000 0000 9995
- Expiry: 12/34
- CVC: 123
- Name: Bob (doesn't really matter actually)
- Email: test@gmail.com (doesn't really matter actually)

### TODO

- When a creator makes an NFT available, we need a mapping between address, token id, and price. When a creator registers an NFT for sale, we will create the stripe product, and use the hook to capture the product id (inside stripe). When the checkout happens, the lookup for the product id will happen there. Pricing is associated with the product. NO PRICING DETAILS SUPPLIED FROM FRONT END
- We need to disconnect the hook with the actions (e.g. minting, product creation, etc). The hook must return very quickly, so we should put this in a queue somewhere
- We need to validate SMS code
- We need to mint the token and send SMS confirmation. SMS sent MUST be valid and can receive SMS; the info is supplied to stripe as part of payment creation, and will be sent to us as metadata. Extra security (metadata holds a JWT that is then sent back to us)
